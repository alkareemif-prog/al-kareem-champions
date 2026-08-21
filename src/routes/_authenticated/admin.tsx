import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCompetition,
  createQuestion,
  getAdminStats,
  listAdminCompetitions,
  publishResults,
  setCompetitionStatus,
} from "@/lib/staff.functions";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Al Kareem International Foundation" },
      {
        name: "description",
        content:
          "Manage competitions, build the question bank and publish results for Al Kareem International Foundation.",
      },
      { property: "og:title", content: "Admin Dashboard — Al Kareem International Foundation" },
      {
        property: "og:description",
        content: "Competition builder, question bank and result publishing tools.",
      },
    ],
  }),
  component: AdminPage,
});

const QUESTION_TYPES = ["mcq", "short", "written"] as const;

function AdminPage() {
  const stats = useServerFn(getAdminStats);
  const list = useServerFn(listAdminCompetitions);
  const addCompetition = useServerFn(createCompetition);
  const addQuestion = useServerFn(createQuestion);
  const publish = useServerFn(publishResults);
  const setStatus = useServerFn(setCompetitionStatus);
  const queryClient = useQueryClient();

  const statsQuery = useQuery({ queryKey: ["admin-stats"], retry: false, queryFn: () => stats() });
  const compQuery = useQuery({
    queryKey: ["admin-competitions"],
    retry: false,
    queryFn: () => list(),
  });

  const [form, setForm] = useState({
    title: "",
    comp_type: "mcq" as "mcq" | "short" | "written" | "mixed",
    category: "",
    reg_start: "",
    reg_end: "",
    exam_start: "",
    exam_end: "",
    duration_minutes: 30,
    negative_marking: false,
    negative_mark_value: 0.25,
    status: "published" as "draft" | "published",
  });

  const [activeComp, setActiveComp] = useState<string | null>(null);
  const [q, setQ] = useState({
    prompt: "",
    q_type: "mcq" as (typeof QUESTION_TYPES)[number],
    marks: 1,
    options: ["", "", "", ""],
    correct_option: 0,
    word_limit: 200,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-competitions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const createComp = useMutation({
    mutationFn: () =>
      addCompetition({
        data: {
          ...form,
          duration_minutes: Number(form.duration_minutes),
          negative_mark_value: Number(form.negative_mark_value),
        },
      }),
    onSuccess: () => {
      toast.success("Competition created");
      setForm({ ...form, title: "", category: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addQ = useMutation({
    mutationFn: () =>
      addQuestion({
        data: {
          competitionId: activeComp!,
          prompt: q.prompt,
          q_type: q.q_type,
          marks: Number(q.marks),
          options: q.q_type === "mcq" ? q.options : undefined,
          correct_option: q.q_type === "mcq" ? Number(q.correct_option) : null,
          word_limit: q.q_type === "mcq" ? null : Number(q.word_limit),
        },
      }),
    onSuccess: () => {
      toast.success("Question added to the bank");
      setQ({ ...q, prompt: "", options: ["", "", "", ""], correct_option: 0 });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (competitionId: string) => publish({ data: { competitionId } }),
    onSuccess: (res: any) => {
      toast.success(`Results published for ${res?.published ?? 0} participant(s)`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (vars: { competitionId: string; status: "draft" | "published" | "closed" }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (statsQuery.error) {
    return (
      <p className="py-20 text-center text-destructive">{(statsQuery.error as Error).message}</p>
    );
  }

  const competitions = (compQuery.data ?? []) as any[];
  const s = statsQuery.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Competition builder, question bank and result publishing"
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total registrations", value: s?.registrations ?? "—" },
          { label: "Active competitions", value: s?.activeCompetitions ?? "—" },
          { label: "Pending evaluations", value: s?.pendingEvaluations ?? "—" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-primary">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Create competition</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ramadan Quiz 2026"
            />
          </div>
          <div>
            <Label htmlFor="comp_type">Type</Label>
            <select
              id="comp_type"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.comp_type}
              onChange={(e) => setForm({ ...form, comp_type: e.target.value as any })}
            >
              <option value="mcq">MCQ</option>
              <option value="short">Short question</option>
              <option value="written">Written</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Hifzul Quran"
            />
          </div>
          <div>
            <Label htmlFor="reg_start">Registration start</Label>
            <Input
              id="reg_start"
              type="datetime-local"
              value={form.reg_start}
              onChange={(e) => setForm({ ...form, reg_start: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="reg_end">Registration end</Label>
            <Input
              id="reg_end"
              type="datetime-local"
              value={form.reg_end}
              onChange={(e) => setForm({ ...form, reg_end: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="exam_start">Exam window start</Label>
            <Input
              id="exam_start"
              type="datetime-local"
              value={form.exam_start}
              onChange={(e) => setForm({ ...form, exam_start: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="exam_end">Exam window end</Label>
            <Input
              id="exam_end"
              type="datetime-local"
              value={form.exam_end}
              onChange={(e) => setForm({ ...form, exam_end: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="negvalue">Negative mark value</Label>
            <Input
              id="negvalue"
              type="number"
              step="0.25"
              min={0}
              value={form.negative_mark_value}
              onChange={(e) => setForm({ ...form, negative_mark_value: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="neg"
              checked={form.negative_marking}
              onCheckedChange={(v) => setForm({ ...form, negative_marking: v })}
            />
            <Label htmlFor="neg">Negative marking</Label>
          </div>
          <div className="sm:col-span-2">
            <Button
              variant="gold"
              disabled={!form.title || createComp.isPending}
              onClick={() => createComp.mutate()}
            >
              {createComp.isPending ? "Creating…" : "Create competition"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold text-primary">Competitions</h2>
      {compQuery.isLoading && <p className="text-muted-foreground">Loading competitions…</p>}
      <div className="space-y-4">
        {competitions.map((comp) => (
          <Card key={comp.id}>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">{comp.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {comp.comp_type?.toUpperCase()} · {comp.category ?? "General"} ·{" "}
                    {comp.duration_minutes} min · {comp.questions?.length ?? 0} question(s)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{comp.status}</Badge>
                  {comp.negative_marking && <Badge variant="outline">Negative marking</Badge>}
                  {comp.results_published && <Badge>Results published</Badge>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveComp(activeComp === comp.id ? null : comp.id)}
                >
                  {activeComp === comp.id ? "Close question bank" : "Question bank"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    statusMut.mutate({
                      competitionId: comp.id,
                      status: comp.status === "published" ? "closed" : "published",
                    })
                  }
                >
                  {comp.status === "published" ? "Close registration" : "Publish competition"}
                </Button>
                <Button
                  size="sm"
                  variant="emerald"
                  disabled={publishMut.isPending}
                  onClick={() => publishMut.mutate(comp.id)}
                >
                  Publish results
                </Button>
              </div>

              {activeComp === comp.id && (
                <div className="mt-6 border-t pt-6">
                  <div className="mb-4 space-y-2">
                    {(comp.questions ?? []).map((question: any, index: number) => (
                      <div key={question.id} className="rounded-md bg-muted/50 p-3 text-sm">
                        <span className="font-medium">
                          {index + 1}. {question.prompt}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          ({question.q_type}, {question.marks} mark
                          {Number(question.marks) === 1 ? "" : "s"})
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor={`prompt-${comp.id}`}>Question</Label>
                      <Textarea
                        id={`prompt-${comp.id}`}
                        value={q.prompt}
                        onChange={(e) => setQ({ ...q, prompt: e.target.value })}
                        placeholder="Write the question…"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`qtype-${comp.id}`}>Question type</Label>
                        <select
                          id={`qtype-${comp.id}`}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={q.q_type}
                          onChange={(e) => setQ({ ...q, q_type: e.target.value as any })}
                        >
                          <option value="mcq">MCQ</option>
                          <option value="short">Short question</option>
                          <option value="written">Written</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`marks-${comp.id}`}>Marks</Label>
                        <Input
                          id={`marks-${comp.id}`}
                          type="number"
                          min={0}
                          value={q.marks}
                          onChange={(e) => setQ({ ...q, marks: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {q.q_type === "mcq" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {q.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${comp.id}`}
                              checked={q.correct_option === index}
                              onChange={() => setQ({ ...q, correct_option: index })}
                              aria-label={`Mark option ${index + 1} as correct`}
                            />
                            <Input
                              value={option}
                              placeholder={`Option ${index + 1}`}
                              onChange={(e) => {
                                const options = [...q.options];
                                options[index] = e.target.value;
                                setQ({ ...q, options });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor={`wl-${comp.id}`}>Word limit (optional)</Label>
                        <Input
                          id={`wl-${comp.id}`}
                          type="number"
                          min={1}
                          value={q.word_limit}
                          onChange={(e) => setQ({ ...q, word_limit: Number(e.target.value) })}
                        />
                      </div>
                    )}

                    <Button
                      variant="gold"
                      className="w-fit"
                      disabled={!q.prompt || addQ.isPending}
                      onClick={() => addQ.mutate()}
                    >
                      {addQ.isPending ? "Saving…" : "Add question"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
