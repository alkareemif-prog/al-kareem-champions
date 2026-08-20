import jsPDF from "jspdf";
import QRCode from "qrcode";
import { FOUNDATION_NAME, LOGO_URL } from "@/lib/brand";

export type TemplateField = {
  key: string;
  label: string;
  x: number; // percentage of width
  y: number; // percentage of height
  size: number;
};

export const DEFAULT_FIELDS: TemplateField[] = [
  { key: "Name", label: "{{Name}}", x: 50, y: 45, size: 28 },
  { key: "Registration Number", label: "{{Registration Number}}", x: 50, y: 55, size: 14 },
  { key: "Competition Name", label: "{{Competition Name}}", x: 50, y: 63, size: 18 },
  { key: "Score", label: "{{Score}}", x: 35, y: 75, size: 14 },
  { key: "Rank", label: "{{Rank}}", x: 65, y: 75, size: 14 },
];

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type CertificateData = {
  participant_name: string;
  registration_number: string;
  competition_title: string;
  score: number | null;
  rank: number | null;
  verification_code: string;
};

export async function generateCertificatePdf(
  certificate: CertificateData,
  options: { backgroundUrl?: string | null; fields?: TemplateField[] } = {},
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  const background = options.backgroundUrl ? await toDataUrl(options.backgroundUrl) : null;
  if (background) {
    doc.addImage(background, "JPEG", 0, 0, width, height);
  } else {
    doc.setFillColor(252, 251, 248);
    doc.rect(0, 0, width, height, "F");
    doc.setDrawColor(197, 160, 60);
    doc.setLineWidth(6);
    doc.rect(18, 18, width - 36, height - 36);
  }

  const logo = await toDataUrl(LOGO_URL);
  if (logo) doc.addImage(logo, "PNG", width / 2 - 32, 34, 64, 64);

  doc.setTextColor(20, 70, 50);
  doc.setFontSize(16);
  doc.text(FOUNDATION_NAME, width / 2, 122, { align: "center" });
  doc.setFontSize(11);
  doc.text("Certificate of Achievement", width / 2, 142, { align: "center" });

  const values: Record<string, string> = {
    Name: certificate.participant_name,
    "Registration Number": certificate.registration_number,
    "Competition Name": certificate.competition_title,
    Score: `Score: ${certificate.score ?? "-"}`,
    Rank: `Rank: #${certificate.rank ?? "-"}`,
  };

  for (const field of options.fields ?? DEFAULT_FIELDS) {
    doc.setFontSize(field.size);
    doc.text(values[field.key] ?? field.label, (field.x / 100) * width, (field.y / 100) * height, {
      align: "center",
    });
  }

  const verifyUrl = `${window.location.origin}/verify?code=${certificate.verification_code}`;
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
  doc.addImage(qr, "PNG", width - 130, height - 130, 92, 92);
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(certificate.verification_code, width - 84, height - 26, { align: "center" });

  doc.save(`${certificate.registration_number}-${certificate.verification_code}.pdf`);
}