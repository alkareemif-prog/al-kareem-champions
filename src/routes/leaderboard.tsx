import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Al Kareem International Foundation" },
      {
        name: "description",
        content: "Ranked list of top competitors across published competitions.",
      },
      { property: "og:title", content: "Leaderboard — Al Kareem International Foundation" },
      { property: "og:description", content: "See who leads the competitions." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, participant_name, registration_number, competition_title, score, rank")
        .order("rank", { ascending: true })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader title="Leaderboard" subtitle="Published results, ranked by total score." />
      <div className="space-y-3">
        {(data ?? []).map((row) => (
          <Card key={row.id} className={row.rank && row.rank <= 3 ? "border-gold shadow-gold" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="font-display text-gold-deep w-10 text-xl font-bold">#{row.rank}</span>
              <Avatar className="size-10">
                <AvatarFallback className="bg-secondary text-primary">
                  {row.participant_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">{row.participant_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.competition_title} · Registration Number: {row.registration_number}
                </p>
              </div>
              <span className="font-semibold text-primary">{row.score}</span>
            </CardContent>
          </Card>
        ))}
        {data && data.length === 0 && (
          <p className="text-muted-foreground">No results have been published yet.</p>
        )}
      </div>
    </div>
  );
}