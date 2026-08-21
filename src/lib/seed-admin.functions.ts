import { createServerFn } from "@tanstack/react-start";

const MASTER_EMAIL = "alkareemif@gmail.com";
const MASTER_PASSWORD = "siam7200";

/**
 * Idempotent bootstrap of the master Super Admin account.
 * Creates the auth user only when missing (never resets an existing password)
 * and guarantees the super_admin role row exists.
 */
export const ensureMasterAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let userId: string | undefined;

  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find(
    (u) => (u.email ?? "").toLowerCase() === MASTER_EMAIL.toLowerCase(),
  );

  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: MASTER_EMAIL,
      password: MASTER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name_en: "Master Administrator" },
    });
    if (error) throw new Error(error.message);
    userId = data.user?.id;
  }

  if (!userId) throw new Error("Could not resolve the master admin account");

  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });
  if (roleError) throw new Error(roleError.message);

  return { ok: true, created: !existing };
});
