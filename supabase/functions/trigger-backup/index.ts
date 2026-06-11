import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface StorageFile {
  name: string;
  size: number;
  mimetype: string;
  created_at: string;
  updated_at: string;
  public_url: string;
}

async function listBucketRecursive(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<StorageFile[]> {
  const all: StorageFile[] = [];
  const { data: entries, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error || !entries) return all;

  const files = entries.filter((e) => e.id);
  for (const f of files) {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(prefix ? `${prefix}/${f.name}` : f.name);
    all.push({
      name: prefix ? `${prefix}/${f.name}` : f.name,
      size: (f.metadata as Record<string, unknown>)?.size as number ?? 0,
      mimetype: (f.metadata as Record<string, unknown>)?.mimetype as string ?? "",
      created_at: f.created_at ?? "",
      updated_at: f.updated_at ?? "",
      public_url: urlData.publicUrl,
    });
  }

  const folders = entries.filter((e) => !e.id);
  for (const folder of folders) {
    const subPrefix = prefix ? `${prefix}/${folder.name}` : folder.name;
    const children = await listBucketRecursive(supabase, bucket, subPrefix);
    all.push(...children);
  }

  return all;
}

async function getAnyUserId(
  supabase: ReturnType<typeof createClient>,
): Promise<string> {
  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  if (profiles?.length) return profiles[0].id as string;

  const { data: backups } = await supabase
    .from("backups")
    .select("user_id")
    .not("user_id", "is", null)
    .limit(1);
  if (backups?.length) return backups[0].user_id as string;

  const { data: products } = await supabase
    .from("products")
    .select("user_id")
    .limit(1);
  if (products?.length) return products[0].user_id as string;

  throw new Error("No se encontró ningún usuario en la base de datos");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Faltan credenciales de Supabase" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const start = Date.now();

    const TABLES = ["products", "categories", "sales", "purchases", "invoices", "profiles"] as const;
    const STORAGE_BUCKETS = ["product-images", "avatars", "invoice-files", "backups"] as const;
    const dump: Record<string, unknown[]> = {};

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.error(`Error leyendo ${table}:`, error.message);
        return json({ error: `Error al leer ${table}: ${error.message}` }, 502);
      }
      dump[table] = data ?? [];
    }

    for (const bucket of STORAGE_BUCKETS) {
      try {
        dump[`_storage:${bucket}`] = await listBucketRecursive(supabase, bucket, "");
      } catch {
        dump[`_storage:${bucket}`] = [];
      }
    }

    const jsonStr = JSON.stringify(dump, null, 2);
    const bytes = new TextEncoder().encode(jsonStr).length;
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `backup_${dateStr}_${Date.now()}.json`;
    const filePath = `${crypto.randomUUID()}.json`;

    const { error: uploadErr } = await supabase.storage
      .from("backups")
      .upload(filePath, new Blob([jsonStr], { type: "application/json" }));

    if (uploadErr) {
      return json({ error: `Error al subir backup: ${uploadErr.message}` }, 502);
    }

    const duration = Date.now() - start;
    const userId = await getAnyUserId(supabase);

    const { error: insertErr } = await supabase.from("backups").insert({
      user_id: userId,
      file_name: fileName,
      file_path: filePath,
      size_bytes: bytes,
      duration_ms: duration,
      tables: [...TABLES, ...STORAGE_BUCKETS],
      status: "completed",
      user_email: "system@automated-backup",
    });

    if (insertErr) {
      return json({ error: `Error al registrar backup: ${insertErr.message}` }, 502);
    }

    return json({
      success: true,
      fileName,
      sizeBytes: bytes,
      durationMs: duration,
    });
  } catch (err) {
    return json({
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});
