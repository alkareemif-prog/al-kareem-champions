import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DIVISIONS } from "@/lib/geo";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Registration Details — Al Kareem International Foundation" },
      { name: "description", content: "Complete your registration profile to receive a Registration Number." },
      { property: "og:title", content: "Registration Details — Al Kareem International Foundation" },
      { property: "og:description", content: "Identity, category, contact and address information." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name_bn: z.string().trim().max(120).optional(),
  full_name_en: z.string().trim().min(2, "Full name (English) is required").max(120),
  father_name: z.string().trim().max(120).optional(),
  date_of_birth: z.string().optional(),
  participant_category: z.enum(["member", "general"]),
  membership_id: z.string().trim().max(50).optional(),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9+\- ]{6,20}$/, "Enter a valid mobile number"),
  address_line: z.string().trim().max(250).optional(),
  institution_name: z.string().trim().max(150).optional(),
});

type FormKey =
  | "full_name_bn"
  | "full_name_en"
  | "father_name"
  | "date_of_birth"
  | "participant_category"
  | "membership_id"
  | "mobile"
  | "address_line"
  | "institution_name";

type Form = Partial<Record<FormKey, string>>;

function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Form>({ participant_category: "general" });
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name_bn: profile.full_name_bn ?? "",
      full_name_en: profile.full_name_en ?? "",
      father_name: profile.father_name ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      participant_category: profile.participant_category ?? "general",
      membership_id: profile.membership_id ?? "",
      mobile: profile.mobile ?? "",
      address_line: profile.address_line ?? "",
      institution_name: profile.institution_name ?? "",
    });
    setDivision(profile.division ?? "");
    setDistrict(profile.district ?? "");
    setUpazila(profile.upazila ?? "");
  }, [profile]);

  const districts = DIVISIONS.find((d) => d.name === division)?.districts ?? [];
  const upazilas = districts.find((d) => d.name === district)?.upazilas ?? [];

  function set(key: FormKey, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (parsed.data.participant_category === "member" && !parsed.data.membership_id) {
      toast.error("Membership ID is required for Member category");
      return;
    }
    setSaving(true);

    let photo_url = profile?.photo_url ?? null;
    if (photo) {
      const path = `${user!.id}/${Date.now()}-${photo.name.replace(/[^\w.-]/g, "")}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, photo, { upsert: true });
      if (uploadError) {
        setSaving(false);
        toast.error(uploadError.message);
        return;
      }
      photo_url = path;
    }

    const payload = {
      id: user!.id,
      full_name_en: parsed.data.full_name_en,
      full_name_bn: parsed.data.full_name_bn ?? null,
      father_name: parsed.data.father_name ?? null,
      participant_category: parsed.data.participant_category,
      membership_id: parsed.data.membership_id ?? null,
      mobile: parsed.data.mobile,
      address_line: parsed.data.address_line ?? null,
      institution_name: parsed.data.institution_name ?? null,
      date_of_birth: parsed.data.date_of_birth || null,
      email: user!.email ?? null,
      division: division || null,
      district: district || null,
      upazila: upazila || null,
      photo_url,
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("registration_number")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Saved. Your Registration Number is ${data.registration_number}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeader
        title="Registration Details"
        subtitle="রেজিস্ট্রেশন নাম্বার পেতে নিচের তথ্যগুলো পূরণ করুন।"
      />
      {profile?.registration_number && (
        <Card className="border-gold mb-6">
          <CardContent className="p-4 text-sm">
            Registration Number:{" "}
            <span className="font-display font-bold text-primary">
              {profile.registration_number}
            </span>
          </CardContent>
        </Card>
      )}

      <form onSubmit={save} className="space-y-8">
        <Section title="Identity">
          <TextField label="Full Name (English)" value={form.full_name_en ?? ""} onChange={(v) => set("full_name_en", v)} />
          <TextField label="পূর্ণ নাম (বাংলা)" value={form.full_name_bn ?? ""} onChange={(v) => set("full_name_bn", v)} />
          <TextField label="Father's Name" value={form.father_name ?? ""} onChange={(v) => set("father_name", v)} />
          <TextField label="Date of Birth" type="date" value={form.date_of_birth ?? ""} onChange={(v) => set("date_of_birth", v)} />
          <div className="space-y-1.5">
            <Label>Profile Photo</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </div>
        </Section>

        <Section title="Category">
          <div className="space-y-1.5">
            <Label>Participant Category</Label>
            <Select
              value={form.participant_category ?? "general"}
              onValueChange={(value) => set("participant_category", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.participant_category === "member" && (
            <TextField
              label="Membership ID"
              value={form.membership_id ?? ""}
              onChange={(v) => set("membership_id", v)}
            />
          )}
        </Section>

        <Section title="Contact & Address">
          <div className="space-y-1.5">
            <Label>Mobile</Label>
            <div className="flex gap-2">
              <Input value={form.mobile ?? ""} onChange={(event) => set("mobile", event.target.value)} maxLength={20} />
              <Button
                type="button"
                variant="goldOutline"
                onClick={() => {
                  setOtpSent(true);
                  toast.info("OTP sending is not enabled yet — this is a placeholder step.");
                }}
              >
                {otpSent ? "OTP sent" : "Send OTP"}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Dropdown
              label="Division"
              value={division}
              options={DIVISIONS.map((d) => d.name)}
              onChange={(value) => {
                setDivision(value);
                setDistrict("");
                setUpazila("");
              }}
            />
            <Dropdown
              label="District"
              value={district}
              options={districts.map((d) => d.name)}
              onChange={(value) => {
                setDistrict(value);
                setUpazila("");
              }}
            />
            <Dropdown label="Upazila" value={upazila} options={upazilas} onChange={setUpazila} />
          </div>
          <TextField label="Address" value={form.address_line ?? ""} onChange={(v) => set("address_line", v)} />
          <TextField label="Institution Name" value={form.institution_name ?? ""} onChange={(v) => set("institution_name", v)} />
        </Section>

        <Button type="submit" variant="gold" size="xl" disabled={saving}>
          {saving ? "Saving…" : "Save registration details"}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border bg-card p-5">
      <legend className="font-display px-2 text-sm font-semibold text-primary">{title}</legend>
      {children}
    </fieldset>
  );
}

function TextField({
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
      <Input type={type} value={value} maxLength={250} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={options.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}