import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ competitionId: z.string().uuid() });

/** Starts (or resumes) the single allowed attempt and returns the paper without answer keys. */
export const startAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: comp, error: compError } = await supabase
      .from("competitions")
      .select("id, title, duration_minutes, exam_start, exam_end, status, negative_marking")
      .eq("id", data.competitionId)
      .maybeSingle();
    if (compError) throw new Error(compError.message);
    if (!comp) throw new Error("Competition not found");

    const { data: existing } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("competition_id", comp.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing && existing.status !== "in_progress") {
      return { locked: true as const, attempt: existing, competition: comp, questions: [], answers: [] };
    }

    let attempt = existing;
    if (!attempt) {
      const { data: created, error } = await supabase
        .from("exam_attempts")
        .insert({ competition_id: comp.id, user_id: context.userId })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      attempt = created;
    }

    // Questions are RLS-restricted to staff, so read them server-side with the
    // privileged client — the caller is already authenticated above and we only
    // project exam-safe columns (never correct_option).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: questions, error: qError } = await supabaseAdmin
      .from("questions")
      .select("id, q_type, prompt, options, marks, word_limit, position")
      .eq("competition_id", comp.id)
      .order("position", { ascending: true });
    if (qError) throw new Error(qError.message);


    const { data: answers } = await supabase
      .from("answers")
      .select("question_id, selected_option, text_answer")
      .eq("attempt_id", attempt!.id);

    return {
      locked: false as const,
      attempt: attempt!,
      competition: comp,
      questions: questions ?? [],
      answers: answers ?? [],
    };
  });

export const saveAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        attemptId: z.string().uuid(),
        questionId: z.string().uuid(),
        selectedOption: z.number().int().min(0).max(3).nullable().optional(),
        textAnswer: z.string().max(20000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: attempt } = await context.supabase
      .from("exam_attempts")
      .select("id, status, user_id")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!attempt || attempt.user_id !== context.userId) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") throw new Error("This attempt is already submitted");

    const { error } = await context.supabase.from("answers").upsert(
      {
        attempt_id: data.attemptId,
        question_id: data.questionId,
        selected_option: data.selectedOption ?? null,
        text_answer: data.textAnswer ?? null,
      },
      { onConflict: "attempt_id,question_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ attemptId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("id, user_id, competition_id, status")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!attempt || attempt.user_id !== context.userId) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") return { alreadySubmitted: true, autoScore: 0 };

    const { data: comp } = await supabase
      .from("competitions")
      .select("negative_marking, negative_mark_value")
      .eq("id", attempt.competition_id)
      .single();

    // Answer keys are staff-only under RLS; grade with the privileged client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, q_type, correct_option, marks")
      .eq("competition_id", attempt.competition_id);


    const { data: answers } = await supabase
      .from("answers")
      .select("id, question_id, selected_option, text_answer")
      .eq("attempt_id", attempt.id);

    let autoScore = 0;
    let needsReview = false;
    for (const q of questions ?? []) {
      const answer = (answers ?? []).find((a) => a.question_id === q.id);
      if (q.q_type === "mcq") {
        if (!answer || answer.selected_option === null) continue;
        if (answer.selected_option === q.correct_option) {
          autoScore += Number(q.marks);
        } else if (comp?.negative_marking) {
          autoScore -= Number(comp.negative_mark_value ?? 0);
        }
        if (answer) {
          await supabase
            .from("answers")
            .update({
              awarded_marks: answer.selected_option === q.correct_option ? Number(q.marks) : 0,
            })
            .eq("id", answer.id);
        }
      } else if (answer) {
        needsReview = true;
        await supabase.from("answers").update({ needs_review: true }).eq("id", answer.id);
      }
    }
    autoScore = Math.max(0, autoScore);

    const { error } = await supabase
      .from("exam_attempts")
      .update({
        status: needsReview ? "submitted" : "evaluated",
        submitted_at: new Date().toISOString(),
        auto_score: autoScore,
        total_score: autoScore,
      })
      .eq("id", attempt.id);
    if (error) throw new Error(error.message);

    return { alreadySubmitted: false, autoScore, needsReview };
  });