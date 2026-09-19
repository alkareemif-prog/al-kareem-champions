import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, ShieldAlert } from "lucide-react";
import { startAttempt, saveAnswer, submitAttempt } from "@/lib/exam.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const MAX_STRIKES = 2;

export const Route = createFileRoute("/_authenticated/exam/$competitionId")({
  head: () => ({
    meta: [
      { title: "Exam Session — Al Kareem International Foundation" },
      { name: "description", content: "Secure one-question-at-a-time exam session with auto-save and countdown timer." },
      { property: "og:title", content: "Exam Session — Al Kareem International Foundation" },
      { property: "og:description", content: "One attempt per competition, monitored exam session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamPage,
});

type AnswerState = Record<string, { option?: number; text?: string }>;

function ExamPage() {
  const { competitionId } = Route.useParams();
  const navigate = useNavigate();
  const start = useServerFn(startAttempt);
  const save = useServerFn(saveAnswer);
  const submit = useServerFn(submitAttempt);

  const { data, isLoading, error } = useQuery({
    queryKey: ["attempt", competitionId],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
    queryFn: () => start({ data: { competitionId } }),
  });

  const [answers, setAnswers] = useState<AnswerState>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [warning, setWarning] = useState(false);
  const submittedRef = useRef(false);
  const seededForRef = useRef<string | null>(null);

  const attemptId = (data && !data.locked ? (data.attempt as any)?.id : null) as string | null;
  const questions = useMemo(
    () => (data && !data.locked ? ((data.questions as any[]) ?? []) : []),
    [data],
  );

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
    onError: (mutationError: Error) => {
      submittedRef.current = false;
      toast.error(mutationError.message);
    },
  });

  const finish = useCallback(() => {
    if (!attemptId || submittedRef.current) return;
    submittedRef.current = true;
    submitMutation.mutate({ data: { attemptId } });
  }, [attemptId, submitMutation]);

  // Seed saved answers exactly once per attempt — no data mixing between users.
  useEffect(() => {
    if (!attemptId || seededForRef.current === attemptId) return;
    seededForRef.current = attemptId;
    const seeded: AnswerState = {};
    for (const answer of ((data as any)?.answers ?? []) as any[]) {
      seeded[answer.question_id] = {
        option: answer.selected_option ?? undefined,
        text: answer.text_answer ?? undefined,
      };
    }
    setAnswers(seeded);
    setIndex(0);
  }, [attemptId, data]);

  // Countdown
  useEffect(() => {
    if (!data || data.locked) return;
    const startedAt = new Date((data.attempt as any).started_at ?? Date.now()).getTime();
    const durationMs = ((data.competition as any).duration_minutes ?? 30) * 60_000;
    const tick = () =>
      setRemaining(Math.max(0, Math.round((startedAt + durationMs - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (remaining === 0 && attemptId && !submittedRef.current) {
      toast.error("Time is up — submitting your exam.");
      finish();
    }
  }, [remaining, attemptId, finish]);

  // Anti-cheat: tab-switch detection with strike system
  useEffect(() => {
    if (!attemptId) return;
    const onHidden = () => {
      if (submittedRef.current) return;
      setStrikes((prev) => {
        const next = prev + 1;
        if (next > MAX_STRIKES) {
          toast.error("Exam auto-submitted: too many tab switches.");
          finish();
        } else {
          setWarning(true);
        }
        return next;
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHidden();
    };
    window.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onHidden);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onHidden);
    };
  }, [attemptId, finish]);

  // Anti-cheat: block right-click and warn before leaving
  useEffect(() => {
    if (!attemptId) return;
    const blockContext = (event: Event) => event.preventDefault();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    document.addEventListener("contextmenu", blockContext);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      document.removeEventListener("contextmenu", blockContext);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p>Preparing your exam…</p>
      </div>
    );
  }
  if (error) return <p className="py-20 text-center text-destructive">{(error as Error).message}</p>;
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

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <PageHeader
          title="No questions yet"
          subtitle="This competition has no published questions. Please contact the organisers."
        />
        <Button variant="gold" onClick={() => navigate({ to: "/dashboard" })}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  function persist(questionId: string, patch: { option?: number; text?: string }) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    if (!attemptId) return;
    const merged = { ...answers[questionId], ...patch };
    saveMutation.mutate({
      data: {
        attemptId,
        questionId,
        selectedOption: merged.option ?? null,
        textAnswer: merged.text ?? null,
      },
    });
  }

  const safeIndex = Math.min(index, questions.length - 1);
  const question = questions[safeIndex];
  const isLast = safeIndex === questions.length - 1;
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a && (a.option !== undefined || (a.text ?? "").trim().length > 0);
  }).length;
  const minutes = remaining !== null ? Math.floor(remaining / 60) : 0;
  const seconds = remaining !== null ? remaining % 60 : 0;

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-6 select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {warning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-destructive/95 px-6 text-center text-destructive-foreground">
          <ShieldAlert className="size-14" />
          <h2 className="font-display text-2xl font-bold">
            Warning: you are not allowed to leave this tab
          </h2>
          <p className="max-w-md text-sm opacity-90">
            Strike {Math.min(strikes, MAX_STRIKES + 1)} of {MAX_STRIKES + 1}. Leaving the exam tab
            again will auto-submit your exam immediately.
          </p>
          <Button variant="gold" size="lg" onClick={() => setWarning(false)}>
            Return to exam
          </Button>
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display truncate font-semibold text-primary">
              {(data.competition as any).title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {saveMutation.isPending ? "Saving…" : `Answered ${answeredCount} of ${questions.length}`}
            </p>
          </div>
          <Badge className="bg-gradient-gold text-accent-foreground font-mono text-base">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="bg-gradient-gold h-full rounded-full transition-all duration-300"
              style={{ width: `${((safeIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Question {safeIndex + 1} of {questions.length}
          </span>
        </div>
      </div>

      <Card className="shadow-elegant">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-foreground">
              {safeIndex + 1}. {question.prompt}
            </p>
            <Badge variant="secondary" className="shrink-0">
              {question.marks} marks
            </Badge>
          </div>

          {question.q_type === "mcq" ? (
            <div className="grid gap-2">
              {((question.options ?? []) as string[]).map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="hover:border-gold flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors"
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
              rows={question.q_type === "written" ? 10 : 4}
              value={answers[question.id]?.text ?? ""}
              maxLength={20000}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              placeholder={question.word_limit ? `Word limit: ${question.word_limit}` : "Your answer"}
              onChange={(event) => persist(question.id, { text: event.target.value })}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={safeIndex === 0}
          onClick={() => setIndex((v) => Math.max(0, v - 1))}
        >
          <ChevronLeft /> Previous
        </Button>

        {isLast ? (
          <Button variant="gold" size="lg" disabled={submitMutation.isPending} onClick={finish}>
            {submitMutation.isPending ? <Loader2 className="animate-spin" /> : null} Submit exam
          </Button>
        ) : (
          <Button
            variant="gold"
            onClick={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
          >
            Next <ChevronRight />
          </Button>
        )}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <AlertTriangle className="size-3.5" /> Copying, right-click and tab switching are monitored.
      </p>
    </div>
  );
}
