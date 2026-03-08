import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!text || text.trim().length < 10) {
      return new Response(JSON.stringify({ issues: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a Persian/Dari language proofreader. Analyze the following text and find spelling, grammar, and style issues.

For each issue found, return:
- "word": the exact problematic word/phrase as it appears in the text
- "suggestion": the corrected version
- "type": one of "spelling", "grammar", "style"
- "reason": a very brief Persian explanation (max 15 words)

Rules:
- Focus on Persian/Dari language errors
- Don't flag proper nouns, technical terms, or intentional style choices
- Maximum 15 issues per request
- If the text is clean, return an empty array
- Be conservative — only flag clear errors

Text to proofread:
${text.slice(0, 3000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a Persian proofreader. Use the provided tool to return issues found." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_issues",
              description: "Submit proofreading issues found in the text",
              parameters: {
                type: "object",
                properties: {
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        word: { type: "string" },
                        suggestion: { type: "string" },
                        type: { type: "string", enum: ["spelling", "grammar", "style"] },
                        reason: { type: "string" },
                      },
                      required: ["word", "suggestion", "type", "reason"],
                    },
                  },
                },
                required: ["issues"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_issues" } },
      }),
    });

    if (!response.ok) {
      console.error("AI proofread error:", response.status);
      return new Response(JSON.stringify({ issues: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result = { issues: [] };

    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-proofread error:", e);
    return new Response(JSON.stringify({ issues: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
