import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DetectedItem {
  productName: string;
  brand: string;
  barcode: string;
  quantity: number;
  unitCost: number;
  isNew: boolean;
}

interface AnalysisResult {
  date: string;
  total: number;
  iva: number;
  iibb: number;
  items: DetectedItem[];
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return json({ error: "No se recibió archivo" }, 400);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = arrayBufferToBase64(bytes);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json({ error: "GEMINI_API_KEY no configurada. Ejecutá: supabase secrets set GEMINI_API_KEY=tu-key" }, 500);
    }

    const prompt = `Analizá la imagen de una factura de proveedor y extraé los datos en formato JSON. No inventes información que no esté visible en la imagen.

Reglas estrictas:
- "date": SOLO si ves una fecha en la factura, formato YYYY-MM-DD. Si no ves ninguna fecha, poné "". NUNCA inventes una fecha.
- "total": monto total numérico de la factura
- "iva": monto de IVA si está visible en la factura, sino 0
- "iibb": monto de Ingresos Brutos si está visible, sino 0
- "items": array de productos detectados
  - "productName": nombre completo del producto
  - "brand": marca del producto si está visible, sino ""
  - "barcode": código de barras si es legible, sino ""
  - "quantity": cantidad numérica
  - "unitCost": costo unitario numérico
  - "isNew": SOLO poné true si el producto no existe en el catálogo habitual. Si es una reposición, poné false. Si no estás seguro, poné false.

Respondé SOLO con el JSON válido, sin explicaciones ni markdown.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: file.type, data: base64 } }] }],
        generation_config: { temperature: 0.1, max_output_tokens: 4000 },
      }),
    });

    if (res.status === 429) {
      return json({ error: "Límite de requests excedido. Esperá 30 segundos y probá de nuevo." }, 429);
    }

    if (!res.ok) {
      const errBody = await res.text();
      return json({ error: `Gemini (${res.status}): ${errBody}` }, 502);
    }

    const json_ = await res.json();
    const text = json_.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return json({ error: "Respuesta vacía de Gemini" }, 502);

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const result: AnalysisResult = JSON.parse(cleaned);

    return json(result);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
