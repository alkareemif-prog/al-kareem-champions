import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ShieldCheck, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Countdown } from "@/components/Countdown";
import { CompetitionCard, type Competition } from "@/components/CompetitionCard";
import { VerifyBox } from "@/components/VerifyBox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FOUNDATION_NAME, LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Al Kareem International Foundation — Competition Portal" },
      {
        name: "description",
        content:
          "মেধা ও মননের লড়াইয়ে আপনাকে স্বাগতম! Join competitions, track results and verify certificates issued by Al Kareem International Foundation.",
      },
      { property: "og:title", content: "Al Kareem International Foundation — Competition Portal" },
      {
        property: "og:description",
        content: "Competitions, live countdowns, leaderboard and instant certificate verification.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: competitions } = useQuery({
    queryKey: ["competitions", "published"],
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

  const { data: winners } = useQuery({
    queryKey: ["wall-of-fame"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, participant_name, competition_title, score, rank")
        .lte("rank", 3)
        .order("issued_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const nextEvent = (competitions ?? []).find(
    (c) => c.exam_start && new Date(c.exam_start).getTime() > Date.now(),
  );

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="bg-primary-deep/70 absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-primary-foreground sm:py-28">
          <img
            src={LOGO_URL}
            alt={`${FOUNDATION_NAME} logo`}
            className="mx-auto h-24 w-24 object-contain drop-shadow-lg sm:h-32 sm:w-32"
          />
          <p className="text-gold-light mt-4 text-xs tracking-[0.35em] uppercase">
            {FOUNDATION_NAME}
          </p>
          <h1 className="mt-4 text-3xl leading-snug font-bold sm:text-5xl">
            মেধা ও মননের লড়াইয়ে আপনাকে স্বাগতম!
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:text-base">
            Register with your unique Registration Number, compete in our national competitions and
            collect a digitally verifiable certificate.
          </p>

          <div className="mt-8">
            {nextEvent ? (
              <>
                <p className="text-gold-light mb-3 text-sm">
                  Next event: <span className="font-semibold">{nextEvent.title}</span>
                </p>
                <Countdown target={nextEvent.exam_start!} />
              </>
            ) : (
              <p className="text-sm text-primary-foreground/70">
                No upcoming event scheduled yet — stay tuned.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="xl">
              <Link to="/auth">Register Now</Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-gold/60 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/events">See Ongoing Events</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionHeading
          icon={<Sparkles className="size-5" />}
          title="Competitions"
          subtitle="Active and upcoming competitions"
        />
        {competitions && competitions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Competitions will appear here as soon as they are published.
          </p>
        )}
      </section>

      <section className="bg-secondary/60 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            icon={<Trophy className="size-5" />}
            title="Wall of Fame"
            subtitle="Top performers of recent competitions"
          />
          {winners && winners.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((winner) => (
                <Card key={winner.id} className="border-gold/40">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="border-gold/60 size-12 border">
                      <AvatarFallback className="bg-gradient-gold text-accent-foreground font-semibold">
                        {winner.participant_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-primary">{winner.participant_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {winner.competition_title}
                      </p>
                      <p className="text-gold-deep text-sm font-medium">
                        Rank #{winner.rank} · {winner.score} marks
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Winners will be celebrated here after results are published.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <SectionHeading
          icon={<ShieldCheck className="size-5" />}
          title="Verification Zone"
          subtitle="Check any certificate instantly"
          center
        />
        <VerifyBox />
      </section>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
  center,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      <span
        className={`text-gold-deep inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase`}
      >
        {icon} {subtitle}
      </span>
      <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{title}</h2>
    </div>
  );
}
