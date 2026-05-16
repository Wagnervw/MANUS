import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const EXTRACTION_PROMPT = `Voce e um assistente da Wagner Reguladora. Analise este PDF de aviso preliminar e extraia os dados do processo.
Retorne APENAS um JSON valido, sem markdown, sem explicacoes, sem texto adicional. Apenas o JSON puro.
O formato deve ser exatamente:
{
  "numero": "numero do processo/sinistro",
  "segurado": "nome do segurado/empresa",
  "seguradora": "nome da seguradora",
  "conducao": "apenas o primeiro nome do regulador/condutor",
  "recebimento": "data de recebimento no formato DD/MM/AAAA",
  "tipoEvento": "Atendimento ou Vistoria",
  "mercadoria": "descricao da mercadoria/carga"
}
Se algum campo nao for encontrado, use string vazia "".`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
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

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "pdfs-2024-09-25",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: EXTRACTION_PROMPT,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        results.push({ name, error: `Claude API error: ${response.status} - ${errText}`, data: null });
        continue;
      }

      const apiResult = await response.json();
      const textContent = apiResult.content?.find(
        (c: { type: string }) => c.type === "text"
      );

      if (!textContent) {
        results.push({ name, error: "No text in Claude response", data: null });
        continue;
      }

      let rawText = textContent.text.trim();
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

      try {
        const parsed = JSON.parse(rawText);
        results.push({ name, error: null, data: parsed });
      } catch {
        results.push({ name, error: `Failed to parse JSON: ${rawText.slice(0, 200)}`, data: null });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
