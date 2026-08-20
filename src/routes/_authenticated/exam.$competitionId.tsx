import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { startAttempt, saveAnswer, submitAttempt } from "@/lib/exam.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/exam/$competitionId")({
  head: () => ({
    meta: [
      { title: "Exam Session — Al Kareem International Foundation" },
      { name: "description", content: "Live exam session with auto-save and countdown timer." },
      { property: "og:title", content: "Exam Session — Al Kareem International Foundation" },
      { property: "og:description", content: "One attempt per competition." },
    ],
  }),
  component: ExamPage,
});

function ExamPage() {
  const { competitionId } = Route.useParams();
  const navigate = useNavigate();
  const start = useServerFn(startAttempt);
  const save = useServerFn(saveAnswer);
  const submit = useServerFn(submitAttempt);

  const { data, isLoading, error } = useQuery({
    queryKey: ["attempt", competitionId],
    retry: false,
    queryFn: () => start({ data: { competitionId } }),
  });

  const [answers, setAnswers] = useState<Record<string, { option?: number; text?: string }>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const submittedRef = useRef(false);

  const saveMutation = useMutation({ mutationFn: save });
  const submitMutation = useMutation({
    mutationFn: submit,
    onSuccess: (result: any) => {
      submittedRef.current = true;
      toast.success(
        result?.needsReview
          ? "Submitted. Written answers are queued for evaluation."
          : `Submitted. Auto score: ${result?.autoScore ?? 0}`,
      );
      navigate({ to: "/dashboard" });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  useEffect(() => {
    if (!data || data.locked) return;
    const seeded: Record<string, { option?: number; text?: string }> = {};
    for (const answer of data.answers as any[]) {
      seeded[answer.question_id] = {
        option: answer.selected_option ?? undefined,
        text: answer.text_answer ?? undefined,
      };
    }
    setAnswers(seeded);
    const startedAt = new Date((data.attempt as any).started_at ?? Date.now()).getTime();
    const durationMs = ((data.competition as any).duration_minutes ?? 30) * 60_000;
    const tick = () => setRemaining(Math.max(0, Math.round((startedAt + durationMs - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (remaining === 0 && data && !data.locked && !submittedRef.current) {
      submittedRef.current = true;
      submitMutation.mutate({ data: { attemptId: (data.attempt as any).id } });
    }
  }, [remaining, data]);

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Loading exam…</p>;
  if (error)
    return <p className="py-20 text-center text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  if (data.locked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <PageHeader title="Attempt already used" subtitle="Only one attempt per competition is allowed." />
        <Button variant="gold" onClick={() => navigate({ to: "/dashboard" })}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const attemptId = (data.attempt as any).id as string;
  const questions = data.questions as any[];

  function persist(questionId: string, patch: { option?: number; text?: string }) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    saveMutation.mutate({
      data: {
        attemptId,
        questionId,
        selectedOption: patch.option ?? null,
        textAnswer: patch.text ?? null,
      },
    });
  }

  const minutes = remaining !== null ? Math.floor(remaining / 60) : 0;
  const seconds = remaining !== null ? remaining % 60 : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="font-display font-semibold text-primary">
            {(data.competition as any).title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {saveMutation.isPending ? "Saving…" : "Answers auto-saved"}
          </p>
        </div>
        <Badge className="bg-gradient-gold text-accent-foreground font-mono text-base">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </Badge>
      </div>

      <div className="space-y-5">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">
                  {index + 1}. {question.prompt}
                </p>
                <Badge variant="secondary">{question.marks} marks</Badge>
              </div>

              {question.q_type === "mcq" ? (
                <div className="grid gap-2">
                  {((question.options ?? []) as string[]).map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="hover:border-gold flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id]?.option === optionIndex}
                        onChange={() => persist(question.id, { option: optionIndex })}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <Textarea
                  rows={question.q_type === "written" ? 8 : 3}
                  value={answers[question.id]?.text ?? ""}
                  maxLength={20000}
                  placeholder={question.word_limit ? `Word limit: ${question.word_limit}` : "Your answer"}
                  onChange={(event) => persist(question.id, { text: event.target.value })}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="gold"
        size="xl"
        className="mt-8 w-full"
        disabled={submitMutation.isPending}
        onClick={() => submitMutation.mutate({ data: { attemptId } })}
      >
        Submit exam
      </Button>
    </div>
  );
}