import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FOUNDATION_NAME, LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Register or Login — Al Kareem International Foundation" },
      {
        name: "description",
        content:
          "Create your competitor account to receive a Registration Number and join competitions.",
      },
      { property: "og:title", content: "Register or Login — Al Kareem International Foundation" },
      { property: "og:description", content: "Sign up or sign in to the competition portal." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    const staff = await isStaff(data.user?.id);
    navigate({ to: staff ? "/admin" : "/dashboard" });
  }

  /** Admins skip the competitor dashboard and land on /admin. */
  async function isStaff(userId?: string) {
    if (!userId) return false;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return (data ?? []).some(
      (r) => r.role === "super_admin" || r.role === "competition_admin",
    );
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name_en: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setEmailSent(true);
      return;
    }
    toast.success("Account created — complete your registration profile.");
    navigate({ to: "/profile" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14">
      <img src={LOGO_URL} alt={`${FOUNDATION_NAME} logo`} className="h-20 w-20 object-contain" />
      <Card className="mt-6 w-full">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-primary">{FOUNDATION_NAME}</CardTitle>
          <CardDescription>Competition &amp; Evaluation Portal</CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center text-sm">
              <p className="font-medium text-primary">Check your email to confirm your account.</p>
              <p className="text-muted-foreground">
                After confirming, sign in and complete your registration form to receive your
                Registration Number.
              </p>
              <Button variant="goldOutline" onClick={() => setEmailSent(false)}>
                Back
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <Field label="Email" value={email} onChange={setEmail} type="email" />
                  <Field label="Password" value={password} onChange={setPassword} type="password" />
                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <Field label="Full Name (English)" value={fullName} onChange={setFullName} />
                  <Field label="Email" value={email} onChange={setEmail} type="email" />
                  <Field label="Password" value={password} onChange={setPassword} type="password" />
                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    Create account
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Detailed identity, category and address information is collected on the next step.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!emailSent && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogle}>
                Continue with Google
              </Button>
            </>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you accept our <Link to="/rules" className="underline">rules</Link> and{" "}
            <Link to="/privacy" className="underline">privacy policy</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        maxLength={255}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}