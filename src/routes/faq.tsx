import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Al Kareem International Foundation" },
      { name: "description", content: "Frequently asked questions about registration, exams, results and certificates." },
      { property: "og:title", content: "FAQ — Al Kareem International Foundation" },
      { property: "og:description", content: "Answers about registration, exams and certificates." },
    ],
  }),
  component: FaqPage,
});

const FAQ = [
  {
    q: "What is a Registration Number?",
    a: "It is the unique identifier issued to you at registration (for example FDN-2026-QZ-000123). It is used for exam entry, results and certificate verification.",
  },
  {
    q: "Can I attempt an exam twice?",
    a: "No. Only one attempt per competition is allowed and the attempt is locked as soon as it starts.",
  },
  {
    q: "How do I know if I am a Member or General participant?",
    a: "Choose Member only if you hold a Membership ID from the foundation. It is verified against the foundation database.",
  },
  {
    q: "When will I receive my certificate?",
    a: "Certificates are issued automatically once the admin publishes the results of a competition.",
  },
  {
    q: "How can someone verify my certificate?",
    a: "By scanning the QR code or entering the verification code / Registration Number on the verification page.",
  },
];

function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader title="Frequently Asked Questions" />
      <Accordion type="single" collapsible className="rounded-xl border bg-card px-4">
        {FAQ.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="text-left text-primary">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}