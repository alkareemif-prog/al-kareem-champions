import { createFileRoute } from "@tanstack/react-router";
import { ensureMasterAdmin } from "@/lib/seed-admin.functions";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const result = await ensureMasterAdmin();
        return Response.json(result);
      },
    },
  },
});
