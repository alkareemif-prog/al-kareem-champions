import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules & Regulations — Al Kareem International Foundation" },
      {
        name: "description",
        content: "Competition rules, eligibility, exam conduct and evaluation policy.",
      },
      { property: "og:title", content: "Rules & Regulations — Al Kareem International Foundation" },
      { property: "og:description", content: "Read the competition rules before participating." },
    ],
  }),
  component: RulesPage,
});

const RULES = [
  "Every participant must register once and use the Registration Number issued by the system for all exams and certificates.",
  "Only one attempt is allowed per competition. Once an exam is started, the attempt is locked.",
  "The exam must be completed within the declared duration. Answers are auto-saved and auto-submitted when the timer ends.",
  "Negative marking applies only where it is explicitly announced for a competition.",
  "Written and short answers are evaluated manually by assigned evaluators.",
  "Results stay in draft until officially published by the foundation.",
  "Any form of impersonation or duplicate registration will lead to disqualification.",
  "Certificates carry a unique verification code and QR code, verifiable on this portal.",
];

function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title="Rules & Regulations" subtitle="প্রতিযোগিতার নিয়মাবলী" />
      <ol className="space-y-4">
        {RULES.map((rule, index) => (
          <li key={rule} className="border-gold/40 rounded-lg border bg-card p-4 shadow-sm">
            <span className="bg-gradient-gold text-accent-foreground mr-3 inline-flex size-6 items-center justify-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <span className="text-sm text-foreground">{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}