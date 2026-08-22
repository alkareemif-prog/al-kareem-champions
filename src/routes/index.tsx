import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  Gauge,
  Users,
  ScrollText,
  UserPlus,
  FileText,
  PenLine,
  Award,
} from "lucide-react";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [comps, certs] = await Promise.all([
        supabase
          .from("competitions")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
      ]);
      return { competitions: comps.count ?? 0, certificates: certs.count ?? 0 };
    },
  });

  const nextEvent = (competitions ?? []).find(
    (c) => c.exam_start && new Date(c.exam_start).getTime() > Date.now(),
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="bg-primary-deep/75 absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-4 py-14 text-center text-primary-foreground sm:py-24">
          <img
            src={LOGO_URL}
            alt={`${FOUNDATION_NAME} logo`}
            className="mx-auto h-20 w-20 object-contain drop-shadow-lg sm:h-28 sm:w-28"
          />
          <p className="text-gold-light mt-4 text-[0.65rem] tracking-[0.3em] uppercase sm:text-xs">
            {FOUNDATION_NAME}
          </p>
          <h1 className="mt-4 text-2xl leading-snug font-bold sm:text-5xl">
            মেধা ও মননের লড়াইয়ে আপনাকে স্বাগতম!
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:text-base">
            Register with your unique Registration Number, compete in our national competitions and
            collect a digitally verifiable certificate.
          </p>

          <div className="border-gold/30 mx-auto mt-8 max-w-2xl rounded-2xl border bg-primary-foreground/10 p-5 shadow-2xl backdrop-blur-md sm:p-7">
            {nextEvent ? (
              <>
                <p className="text-gold-light text-xs tracking-[0.2em] uppercase">Next event</p>
                <p className="mt-1 mb-5 text-base font-semibold sm:text-lg">{nextEvent.title}</p>
                <Countdown target={nextEvent.exam_start!} />
              </>
            ) : (
              <p className="text-sm text-primary-foreground/75">
                No upcoming event scheduled yet — stay tuned for the next announcement.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="gold" size="xl">
              <Link to="/auth">Register Now</Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-gold/60 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/events">View Ongoing Events</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Competitions */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <SectionHeading
          icon={<Sparkles className="size-4" />}
          title="Competitions"
          subtitle="Active and upcoming competitions"
        />
        {competitions && competitions.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Why participate */}
      <section className="bg-muted/50 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            icon={<BadgeCheck className="size-4" />}
            title="Why Participate?"
            subtitle="Built for fairness and recognition"
            center
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ShieldCheck className="size-5" />,
                title: "Verifiable Certificates",
                body: "Every certificate carries a QR code and unique verification code.",
              },
              {
                icon: <Gauge className="size-5" />,
                title: "Instant MCQ Scoring",
                body: "Objective answers are graded automatically the moment you submit.",
              },
              {
                icon: <ScrollText className="size-5" />,
                title: "Expert Evaluation",
                body: "Written answers are reviewed by assigned evaluators with comments.",
              },
              {
                icon: <Users className="size-5" />,
                title: "National Leaderboard",
                body: "Compete with participants across divisions and districts.",
              },
            ].map((item) => (
              <Card key={item.title} className="h-full rounded-2xl border-border/60 bg-card shadow-sm">
                <CardContent className="p-6">
                  <span className="bg-gradient-gold text-accent-foreground inline-flex size-11 items-center justify-center rounded-xl">
                    {item.icon}
                  </span>
                  <h3 className="font-display mt-4 text-base font-semibold text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <SectionHeading
          icon={<UserPlus className="size-4" />}
          title="How It Works"
          subtitle="Four simple steps"
          center
        />
        <ol className="relative space-y-6 border-l border-border pl-6">
          {[
            {
              icon: <UserPlus className="size-4" />,
              title: "Register",
              body: "Create your account with email and password — no confirmation link needed.",
            },
            {
              icon: <FileText className="size-4" />,
              title: "Complete your profile",
              body: "Submit identity, category and address details to receive your Registration Number.",
            },
            {
              icon: <PenLine className="size-4" />,
              title: "Sit for the exam",
              body: "One attempt per competition with a live timer and auto-saved answers.",
            },
            {
              icon: <Award className="size-4" />,
              title: "Collect your certificate",
              body: "Once results are published, download your verifiable PDF certificate.",
            },
          ].map((step, index) => (
            <li key={step.title} className="relative">
              <span className="bg-gradient-emerald absolute -left-[2.4rem] flex size-8 items-center justify-center rounded-full text-primary-foreground">
                {step.icon}
              </span>
              <p className="text-gold-deep text-xs font-semibold tracking-widest uppercase">
                Step {index + 1}
              </p>
              <h3 className="font-display text-base font-semibold text-primary">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Statistics */}
      <section className="bg-gradient-emerald py-12 text-primary-foreground">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
          <Stat value={stats?.competitions ?? 0} label="Published competitions" />
          <Stat value={stats?.certificates ?? 0} label="Certificates issued" />
          <Stat value={winners?.length ?? 0} label="Recent top performers" />
          <Stat value={64} label="Districts covered" />
        </div>
      </section>

      {/* Wall of fame */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            icon={<Trophy className="size-4" />}
            title="Wall of Fame"
            subtitle="Top performers of recent competitions"
          />
          {winners && winners.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((winner) => (
                <Card key={winner.id} className="border-gold/40 rounded-2xl">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="border-gold/60 size-12 border">
                      <AvatarFallback className="bg-gradient-gold text-accent-foreground font-semibold">
                        {winner.participant_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-primary">
                        {winner.participant_name}
                      </p>
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
            <p className="text-muted-foreground">
              Winners will be celebrated here after results are published.
            </p>
          )}
        </div>
      </section>

      {/* Verify */}
      <section className="bg-muted/50 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <SectionHeading
            icon={<ShieldCheck className="size-4" />}
            title="Verify Your Certificate"
            subtitle="Check any certificate instantly"
            center
          />
          <VerifyBox />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-gold-light text-3xl font-bold tabular-nums sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-primary-foreground/75 sm:text-sm">{label}</p>
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
      <span className="text-gold-deep inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase">
        {icon} {subtitle}
      </span>
      <h2 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{title}</h2>
    </div>
  );
}
