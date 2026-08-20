import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { BadgeCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { VerifyBox } from "@/components/VerifyBox";
import { Card, CardContent } from "@/components/ui/card";
import { FOUNDATION_NAME, LOGO_URL } from "@/lib/brand";

export const Route = createFileRoute("/verify")({
  validateSearch: z.object({ code: z.string().max(64).optional() }),
  head: () => ({
    meta: [
      { title: "Verify a Certificate — Al Kareem International Foundation" },
      {
        name: "description",
        content:
          "Instantly verify the authenticity of a certificate issued by Al Kareem International Foundation.",
      },
      { property: "og:title", content: "Verify a Certificate — Al Kareem International Foundation" },
      { property: "og:description", content: "Enter a certificate code or Registration Number." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { code } = Route.useSearch();

  const { data, isFetching } = useQuery({
    queryKey: ["verify", code],
    enabled: Boolean(code),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select(
          "id, participant_name, registration_number, competition_title, score, rank, verification_code, issued_at",
        )
        .or(`verification_code.eq.${code},registration_number.eq.${code}`)
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader
        title="Certificate Verification"
        subtitle="Enter the certificate code or Registration Number printed on the certificate."
      />
      <VerifyBox />

      {code && (
        <div className="mt-10">
          {isFetching && <p className="text-center text-muted-foreground">Checking…</p>}
          {!isFetching && data && data.length > 0 && (
            <div className="space-y-4">
              {data.map((certificate) => (
                <Card key={certificate.id} className="border-gold shadow-gold">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center gap-3">
                      <img src={LOGO_URL} alt="" className="h-12 w-12 object-contain" />
                      <p className="flex items-center gap-2 font-semibold text-primary">
                        <BadgeCheck className="text-gold-deep size-5" />✅ Authentic Certificate
                        Issued by {FOUNDATION_NAME}
                      </p>
                    </div>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <Row label="Participant" value={certificate.participant_name} />
                      <Row label="Registration Number" value={certificate.registration_number} />
                      <Row label="Competition" value={certificate.competition_title} />
                      <Row label="Score" value={String(certificate.score ?? "-")} />
                      <Row label="Rank" value={`#${certificate.rank ?? "-"}`} />
                      <Row label="Verification Code" value={certificate.verification_code} />
                      <Row
                        label="Issued"
                        value={new Date(certificate.issued_at).toLocaleDateString()}
                      />
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!isFetching && data && data.length === 0 && (
            <Card className="border-destructive/60">
              <CardContent className="flex items-center gap-3 p-6 text-destructive">
                <XCircle /> No certificate found for “{code}”.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}