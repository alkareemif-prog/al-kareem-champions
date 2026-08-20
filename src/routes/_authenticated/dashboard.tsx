import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, ClipboardList, Award, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Al Kareem International Foundation" },
      { name: "description", content: "Your Registration Number, attempts, results and certificates." },
      { property: "og:title", content: "My Dashboard — Al Kareem International Foundation" },
      { property: "og:description", content: "Track your competitions and certificates." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, roles, isAdmin, isEvaluator } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["my-attempts", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_attempts")
        .select("id, status, total_score, rank, competitions(title, results_published)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader title="My Dashboard" subtitle={profile?.full_name_en ?? user?.email ?? ""} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-gold shadow-gold">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Registration Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-xl font-bold text-primary">
              {profile?.registration_number ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-primary">
                  {role.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="gold" size="sm">
              <Link to="/profile">
                <Settings /> Registration details
              </Link>
            </Button>
            <Button asChild variant="goldOutline" size="sm">
              <Link to="/certificates">
                <Award /> My certificates
              </Link>
            </Button>
            {isEvaluator && (
              <Button asChild variant="outline" size="sm">
                <Link to="/evaluate">
                  <ClipboardList /> Evaluation panel
                </Link>
              </Button>
            )}
            {isAdmin && (
              <Button asChild variant="emerald" size="sm">
                <Link to="/admin">
                  <ShieldCheck /> Admin
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-primary">My attempts</h2>
      <div className="space-y-3">
        {(attempts ?? []).map((attempt: any) => (
          <Card key={attempt.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span className="font-medium text-primary">{attempt.competitions?.title}</span>
              <span className="text-muted-foreground">Status: {attempt.status}</span>
              <span>
                {attempt.competitions?.results_published
                  ? `Score ${attempt.total_score} · Rank #${attempt.rank ?? "-"}`
                  : "Result pending publication"}
              </span>
            </CardContent>
          </Card>
        ))}
        {attempts && attempts.length === 0 && (
          <p className="text-muted-foreground">
            You have not attempted any competition yet. <Link to="/events" className="underline">Browse events</Link>.
          </p>
        )}
      </div>
    </div>
  );
}