import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getReviewQueue, gradeAnswer } from "@/lib/staff.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/evaluate")({
  head: () => ({
    meta: [
      { title: "Evaluation Panel — Al Kareem International Foundation" },
      { name: "description", content: "Review written answers, award marks and add comments." },
      { property: "og:title", content: "Evaluation Panel — Al Kareem International Foundation" },
      { property: "og:description", content: "Pending review queue for evaluators." },
    ],
  }),
  component: EvaluatePage,
});

function EvaluatePage() {
  const queue = useServerFn(getReviewQueue);
  const grade = useServerFn(gradeAnswer);
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, { marks: string; comment: string }>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["review-queue"],
    retry: false,
    queryFn: () => queue(),
  });

  const mutation = useMutation({
    mutationFn: grade,
    onSuccess: () => {
      toast.success("Marks saved");
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Loading queue…</p>;
  if (error) return <p className="py-20 text-center text-destructive">{(error as Error).message}</p>;

  const items = (data ?? []) as any[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title="Evaluation Panel" subtitle={`${items.length} answer(s) pending review`} />
      {items.length === 0 && <p className="text-muted-foreground">Nothing pending. Well done.</p>}
      <div className="space-y-5">
        {items.map((item) => {
          const draft = drafts[item.id] ?? { marks: "", comment: "" };
          const maxMarks = Number(item.questions?.marks ?? 0);
          return (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-primary">
                    {item.exam_attempts?.competitions?.title}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Max {maxMarks} marks</span>
                </div>
                <p className="font-medium text-primary">{item.questions?.prompt}</p>
                <Textarea readOnly value={item.text_answer ?? ""} rows={6} className="bg-muted" />
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-28">
                    <Input
                      type="number"
                      min={0}
                      max={maxMarks || 1000}
                      placeholder="Marks"
                      value={draft.marks}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.id]: { ...draft, marks: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <Input
                    className="flex-1"
                    placeholder="Comment (optional)"
                    maxLength={2000}
                    value={draft.comment}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, comment: event.target.value },
                      }))
                    }
                  />
                  <Button
                    variant="gold"
                    disabled={mutation.isPending || draft.marks === ""}
                    onClick={() => {
                      const marks = Number(draft.marks);
                      if (Number.isNaN(marks) || marks < 0 || (maxMarks && marks > maxMarks)) {
                        toast.error(`Marks must be between 0 and ${maxMarks}`);
                        return;
                      }
                      mutation.mutate({
                        data: { answerId: item.id, marks, comment: draft.comment || undefined },
                      });
                    }}
                  >
                    Save marks
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}