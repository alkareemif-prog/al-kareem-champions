import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompetitionCard, type Competition } from "@/components/CompetitionCard";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Ongoing Events — Al Kareem International Foundation" },
      {
        name: "description",
        content: "All ongoing and upcoming competitions of Al Kareem International Foundation.",
      },
      { property: "og:title", content: "Ongoing Events — Al Kareem International Foundation" },
      { property: "og:description", content: "Browse competitions open for participation." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["competitions", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select(
          "id, title, description, comp_type, category, exam_start, duration_minutes, results_published",
        )
        .eq("status", "published")
        .order("exam_start", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Competition[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <PageHeader
        title="Ongoing Events"
        subtitle="Choose a competition and participate with your Registration Number."
      />
      {isLoading && <p className="text-muted-foreground">Loading competitions…</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </div>
      {data && data.length === 0 && (
        <p className="text-muted-foreground">No published competitions right now.</p>
      )}
    </div>
  );
}