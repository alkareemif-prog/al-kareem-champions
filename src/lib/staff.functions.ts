import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: any, userId: string, roles: string[]) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const mine = ((data ?? []) as { role: string }[]).map((r) => r.role);
  if (!mine.some((r) => roles.includes(r))) throw new Error("Not authorised");
  return mine;
}

/** Evaluator queue: submitted written/short answers awaiting marks. */
export const getReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId, [
      "evaluator",
      "super_admin",
      "competition_admin",
    ]);
    const { data, error } = await context.supabase
      .from("answers")
      .select(
        "id, text_answer, awarded_marks, evaluator_comment, questions(prompt, marks, word_limit), exam_attempts(id, user_id, competition_id, competitions(title))",
      )
      .eq("needs_review", true)
      .order("updated_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const gradeAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        answerId: z.string().uuid(),
        marks: z.number().min(0).max(1000),
        comment: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, [
      "evaluator",
      "super_admin",
      "competition_admin",
    ]);
    const supabase = context.supabase;
    const { data: answer, error } = await supabase
      .from("answers")
      .update({
        awarded_marks: data.marks,
        evaluator_comment: data.comment ?? null,
        evaluated_by: context.userId,
        needs_review: false,
      })
      .eq("id", data.answerId)
      .select("attempt_id")
      .single();
    if (error) throw new Error(error.message);

    // Recompute the attempt total once this answer is graded.
    const { data: answers } = await supabase
      .from("answers")
      .select("awarded_marks, needs_review, selected_option")
      .eq("attempt_id", answer.attempt_id);
    const pending = (answers ?? []).some((a: any) => a.needs_review);
    const manual = (answers ?? [])
      .filter((a: any) => a.selected_option === null)
      .reduce((sum: number, a: any) => sum + Number(a.awarded_marks ?? 0), 0);
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("auto_score")
      .eq("id", answer.attempt_id)
      .single();
    await supabase
      .from("exam_attempts")
      .update({
        manual_score: manual,
        total_score: Number(attempt?.auto_score ?? 0) + manual,
        status: pending ? "submitted" : "evaluated",
      })
      .eq("id", answer.attempt_id);
    return { ok: true, pending };
  });

/** Publishes results: ranks attempts, issues certificates, flips the public flag. */
export const publishResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ competitionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, ["super_admin", "competition_admin"]);
    const supabase = context.supabase;

    const { data: comp } = await supabase
      .from("competitions")
      .select("id, title")
      .eq("id", data.competitionId)
      .single();

    const { data: attempts, error } = await supabase
      .from("exam_attempts")
      .select("id, user_id, total_score")
      .eq("competition_id", data.competitionId)
      .neq("status", "in_progress")
      .order("total_score", { ascending: false });
    if (error) throw new Error(error.message);

    let rank = 0;
    for (const attempt of attempts ?? []) {
      rank += 1;
      await supabase.from("exam_attempts").update({ rank }).eq("id", attempt.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("registration_number, full_name_en, full_name_bn")
        .eq("id", attempt.user_id)
        .maybeSingle();

      const verificationCode = `AKIF-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${rank
        .toString()
        .padStart(3, "0")}`;

      await supabase.from("certificates").upsert(
        {
          user_id: attempt.user_id,
          competition_id: data.competitionId,
          registration_number: profile?.registration_number ?? "N/A",
          participant_name: profile?.full_name_en ?? profile?.full_name_bn ?? "Participant",
          competition_title: comp?.title ?? "Competition",
          score: attempt.total_score,
          rank,
          verification_code: verificationCode,
        },
        { onConflict: "user_id,competition_id" },
      );
    }

    await supabase
      .from("competitions")
      .update({ results_published: true })
      .eq("id", data.competitionId);

    return { published: rank };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId, ["super_admin", "competition_admin"]);
    const supabase = context.supabase;
    const [registrations, competitions, pending] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("competitions")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("answers").select("id", { count: "exact", head: true }).eq("needs_review", true),
    ]);
    return {
      registrations: registrations.count ?? 0,
      activeCompetitions: competitions.count ?? 0,
      pendingEvaluations: pending.count ?? 0,
    };
  });
export const listAdminCompetitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId, ["super_admin", "competition_admin"]);
    const { data, error } = await context.supabase
      .from("competitions")
      .select(
        "id, title, comp_type, category, status, duration_minutes, negative_marking, results_published, exam_start, exam_end, questions(id, prompt, q_type, marks, options, correct_option, word_limit, position)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(3).max(200),
        comp_type: z.enum(["mcq", "short", "written", "mixed"]),
        category: z.string().max(100).optional(),
        reg_start: z.string().optional(),
        reg_end: z.string().optional(),
        exam_start: z.string().optional(),
        exam_end: z.string().optional(),
        duration_minutes: z.number().int().min(1).max(600),
        negative_marking: z.boolean(),
        negative_mark_value: z.number().min(0).max(10),
        status: z.enum(["draft", "published"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, ["super_admin", "competition_admin"]);
    const { data: row, error } = await context.supabase
      .from("competitions")
      .insert({
        title: data.title,
        comp_type: data.comp_type,
        category: data.category || null,
        reg_start: data.reg_start || null,
        reg_end: data.reg_end || null,
        exam_start: data.exam_start || null,
        exam_end: data.exam_end || null,
        duration_minutes: data.duration_minutes,
        negative_marking: data.negative_marking,
        negative_mark_value: data.negative_mark_value,
        status: data.status,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setCompetitionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ competitionId: z.string().uuid(), status: z.enum(["draft", "published", "closed"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, ["super_admin", "competition_admin"]);
    const { error } = await context.supabase
      .from("competitions")
      .update({ status: data.status })
      .eq("id", data.competitionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        competitionId: z.string().uuid(),
        prompt: z.string().min(3).max(4000),
        q_type: z.enum(["mcq", "short", "written"]),
        marks: z.number().min(0).max(1000),
        options: z.array(z.string()).max(4).optional(),
        correct_option: z.number().int().min(0).max(3).nullable().optional(),
        word_limit: z.number().int().min(1).max(5000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, ["super_admin", "competition_admin"]);
    const supabase = context.supabase;
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("competition_id", data.competitionId);
    const { error } = await supabase.from("questions").insert({
      competition_id: data.competitionId,
      prompt: data.prompt,
      q_type: data.q_type,
      marks: data.marks,
      options: data.q_type === "mcq" ? (data.options ?? []) : [],
      correct_option: data.q_type === "mcq" ? (data.correct_option ?? 0) : null,
      word_limit: data.q_type === "mcq" ? null : (data.word_limit ?? null),
      position: (count ?? 0) + 1,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
