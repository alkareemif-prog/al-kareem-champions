import { Link } from "@tanstack/react-router";
import { CalendarClock, Layers, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type Competition = {
  id: string;
  title: string;
  description: string | null;
  comp_type: string;
  category: string | null;
  exam_start: string | null;
  duration_minutes: number;
  results_published: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  mcq: "MCQ",
  short: "Short Question",
  written: "Written",
  mixed: "Mixed",
};

export function CompetitionCard({ competition }: { competition: Competition }) {
  return (
    <Card className="border-border/70 flex h-full flex-col overflow-hidden transition-shadow hover:shadow-elegant">
      <div className="bg-gradient-emerald h-1.5" />
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-gradient-gold text-accent-foreground border-0">
            {TYPE_LABEL[competition.comp_type] ?? competition.comp_type}
          </Badge>
          {competition.category && (
            <Badge variant="secondary" className="text-primary">
              {competition.category}
            </Badge>
          )}
        </div>
        <CardTitle className="font-display mt-2 text-lg text-primary">{competition.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        {competition.description && <p className="line-clamp-3">{competition.description}</p>}
        <p className="flex items-center gap-2">
          <Timer className="size-4" /> {competition.duration_minutes} minutes
        </p>
        {competition.exam_start && (
          <p className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            {new Date(competition.exam_start).toLocaleString()}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Layers className="size-4" />
          {competition.results_published ? "Results published" : "Results pending"}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="gold" className="w-full">
          <Link to="/exam/$competitionId" params={{ competitionId: competition.id }}>
            Participate
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}