import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const EXTRACTION_PROMPT = `Voce e um assistente da Wagner Reguladora. Analise este aviso preliminar em PDF.
Extraia os dados e retorne EXCLUSIVAMENTE um objeto JSON valido.
{
  "numero": "numero do processo (ex: 202610.1234.01)",
  "segurado": "nome do segurado",
  "seguradora": "nome da seguradora",
  "conducao": "Apenas o primeiro nome do regulador",
  "recebimento": "data no formato DD/MM/AAAA",
  "tipoEvento": "Atendimento ou Vistoria",
  "mercadoria": "tipo de mercadoria"
}
Valores nao encontrados devem ser "".`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No PDF files provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const file of files) {
      const { base64, name } = file;

      if (!base64) {
        results.push({ name, error: "Empty file content", data: null });
        continue;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64,
                  },
                },
                { text: EXTRACTION_PROMPT },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        results.push({
          name,
          error: `Gemini API error: ${response.status} - ${errText}`,
          data: null,
        });
        continue;
      }

      const apiResult = await response.json();
      const rawText =
        apiResult.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      try {
        const parsed = JSON.parse(rawText);
        results.push({ name, error: null, data: parsed });
      } catch {
        results.push({
          name,
          error: `Failed to parse JSON: ${rawText.slice(0, 200)}`,
          data: null,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
