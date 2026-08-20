import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateCertificatePdf, DEFAULT_FIELDS, type TemplateField } from "@/lib/certificate";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "My Certificates — Al Kareem International Foundation" },
      { name: "description", content: "Download your certificates with QR verification." },
      { property: "og:title", content: "My Certificates — Al Kareem International Foundation" },
      { property: "og:description", content: "Certificates issued after result publication." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["my-certificates", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function download(certificate: any) {
    const { data: template } = await supabase
      .from("certificate_templates")
      .select("background_url, fields")
      .eq("competition_id", certificate.competition_id)
      .maybeSingle();

    let backgroundUrl: string | null = null;
    if (template?.background_url) {
      const { data: signed } = await supabase.storage
        .from("certificate-assets")
        .createSignedUrl(template.background_url, 120);
      backgroundUrl = signed?.signedUrl ?? null;
    }

    try {
      await generateCertificatePdf(certificate, {
        backgroundUrl,
        fields: (template?.fields as TemplateField[] | null) ?? DEFAULT_FIELDS,
      });
    } catch {
      toast.error("Could not build the certificate PDF. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader title="My Certificates" subtitle="সার্টিফিকেট ডাউনলোড ও যাচাই" />
      {data && data.length === 0 && (
        <p className="text-muted-foreground">
          No certificates yet. They are issued once results are published.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {(data ?? []).map((certificate) => (
          <Card key={certificate.id} className="border-gold shadow-gold">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-primary">
                    {certificate.competition_title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {certificate.registration_number} · Rank #{certificate.rank ?? "-"} · Score{" "}
                    {certificate.score ?? "-"}
                  </p>
                </div>
                <QrPreview code={certificate.verification_code} />
              </div>
              <Button variant="gold" size="sm" onClick={() => download(certificate)}>
                <Download /> Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QrPreview({ code }: { code: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/verify?code=${code}`, { margin: 1, width: 160 })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [code]);
  return src ? <img src={src} alt={`QR code for ${code}`} className="size-16 rounded" /> : null;
}