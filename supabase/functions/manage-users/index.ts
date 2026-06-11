import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Faltan credenciales" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === "POST") {
      const body = await req.json();
      const { userId, action } = body;

      if (!userId) return json({ error: "Falta userId" }, 400);

      if (action === "toggle-block") {
        const { data: user } = await supabase.auth.admin.getUserById(userId);
        if (!user?.user) return json({ error: "Usuario no encontrado" }, 404);

        const isBlocked = user.user.banned_until !== null;
        if (isBlocked) {
          await supabase.auth.admin.unbanUser(userId);
        } else {
          await supabase.auth.admin.banUser(userId);
        }
        return json({ success: true, isBlocked: !isBlocked });
      }

      return json({ error: "Acción no válida" }, 400);
    }

    return json({ error: "Método no soportado" }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
