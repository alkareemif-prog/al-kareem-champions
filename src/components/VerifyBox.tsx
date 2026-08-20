import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyBox() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!code.trim()) return;
        navigate({ to: "/verify", search: { code: code.trim() } });
      }}
      className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      <Input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        maxLength={64}
        placeholder="Certificate Code or Registration Number"
        className="h-12 bg-card"
        aria-label="Certificate code or Registration Number"
      />
      <Button type="submit" variant="emerald" size="xl">
        <ShieldCheck /> Verify
      </Button>
    </form>
  );
}