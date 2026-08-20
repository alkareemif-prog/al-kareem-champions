import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Al Kareem International Foundation" },
      { name: "description", content: "How Al Kareem International Foundation collects and protects participant data." },
      { property: "og:title", content: "Privacy Policy — Al Kareem International Foundation" },
      { property: "og:description", content: "Our data protection commitments to participants." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-sm leading-relaxed text-muted-foreground">
      <PageHeader title="Privacy Policy" />
      <p>
        Al Kareem International Foundation collects only the information required to run its
        competitions: your name, father&apos;s name, date of birth, photo, contact details, address and
        institution.
      </p>
      <p>
        Your Registration Number, competition scores and rank become publicly visible only after the
        foundation publishes the results of a competition. Certificate verification pages display the
        participant name, competition, score and rank.
      </p>
      <p>
        Mobile numbers, email addresses, membership IDs and profile photos are never shown publicly and
        are accessible only to authorised administrators and evaluators.
      </p>
      <p>
        You may request correction or deletion of your data by writing to
        info.alkareemif@gmail.com.
      </p>
    </div>
  );
}