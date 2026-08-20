import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Al Kareem International Foundation" },
      {
        name: "description",
        content: "Published competition results and certificate availability.",
      },
      { property: "og:title", content: "Results — Al Kareem International Foundation" },
      { property: "og:description", content: "Check published competition results." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { data } = useQuery({
    queryKey: ["published-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, category, comp_type, exam_start")
        .eq("status", "published")
        .eq("results_published", true)
        .order("exam_start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader
        title="Results"
        subtitle="Results are published by the foundation once evaluation is complete."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {(data ?? []).map((comp) => (
          <Card key={comp.id}>
            <CardHeader>
              <CardTitle className="font-display text-primary">{comp.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                {comp.category ?? "General"} · {comp.comp_type.toUpperCase()}
              </p>
              <Button asChild variant="goldOutline" size="sm">
                <Link to="/leaderboard">View ranking</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {data && data.length === 0 && (
          <p className="text-muted-foreground">No results published yet.</p>
        )}
      </div>
    </div>
  );
}