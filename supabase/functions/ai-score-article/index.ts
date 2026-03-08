import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, content, articleId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a strict editorial AI evaluator and content moderator for a Persian-language journal platform called Nobahar.

Your job has TWO parts:

PART 1 - CONTENT MODERATION:
Check if this article contains any of the following prohibited content:
- Hate speech, discrimination, or content promoting division between ethnic/religious groups
- Insults, defamation, or personal attacks
- Adult/sexual content
- Violence promotion or terrorism support
- Plagiarism indicators (if the content appears to be directly copied from well-known sources)
- Spam, advertising, or meaningless content
- Misinformation or dangerous health/medical claims

If ANY prohibited content is found, set "approved" to false and provide a clear Persian-language reason in "rejection_reason".

PART 2 - QUALITY SCORING:
Evaluate the article on 5 criteria with integer scores:
- science (0-15): Scientific accuracy, references, factual correctness
- ethics (0-10): Ethical standards, respect, responsibility
- writing (0-10): Writing quality, structure, paragraphing, clarity
- timing (0-10): Relevance, timeliness of the topic
- innovation (0-5): Originality, fresh perspective

MINIMUM THRESHOLD: The average percentage score must be at least 40% for approval.
Calculate: ((science/15 + ethics/10 + writing/10 + timing/10 + innovation/5) / 5) * 100
If below 40%, set "approved" to false with reason explaining the quality is insufficient.

Article Title: ${title}

Article Content: ${content.slice(0, 4000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a strict content moderator and quality evaluator. Use the provided tool to return your evaluation." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_evaluation",
              description: "Submit article moderation and quality evaluation results",
              parameters: {
                type: "object",
                properties: {
                  approved: { type: "boolean", description: "Whether the article passes moderation and quality checks" },
                  rejection_reason: { type: "string", description: "Persian-language reason for rejection, empty string if approved" },
                  science: { type: "integer", minimum: 0, maximum: 15 },
                  ethics: { type: "integer", minimum: 0, maximum: 10 },
                  writing: { type: "integer", minimum: 0, maximum: 10 },
                  timing: { type: "integer", minimum: 0, maximum: 10 },
                  innovation: { type: "integer", minimum: 0, maximum: 5 },
                },
                required: ["approved", "rejection_reason", "science", "ethics", "writing", "timing", "innovation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "سرویس ارزیابی مشغول است. لطفاً کمی صبر کنید.", code: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "خطای سرویس ارزیابی", code: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let evaluation;

    if (toolCall?.function?.arguments) {
      evaluation = JSON.parse(toolCall.function.arguments);
    } else {
      const content_text = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content_text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI evaluation");
      }
    }

    // Clamp scores
    const scores = {
      science: Math.min(15, Math.max(0, Math.round(evaluation.science || 0))),
      ethics: Math.min(10, Math.max(0, Math.round(evaluation.ethics || 0))),
      writing: Math.min(10, Math.max(0, Math.round(evaluation.writing || 0))),
      timing: Math.min(10, Math.max(0, Math.round(evaluation.timing || 0))),
      innovation: Math.min(5, Math.max(0, Math.round(evaluation.innovation || 0))),
    };

    // Calculate average percentage
    const avgPercent = ((scores.science / 15 + scores.ethics / 10 + scores.writing / 10 + scores.timing / 10 + scores.innovation / 5) / 5) * 100;
    
    // Determine final approval
    const approved = evaluation.approved !== false && avgPercent >= 40;
    const rejectionReason = !approved
      ? (evaluation.rejection_reason || "کیفیت مقاله برای انتشار کافی نیست. لطفاً محتوا را بازبینی و بهبود دهید.")
      : "";

    // Update article with scores and status
    if (articleId) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const updateBody: Record<string, unknown> = {
        ai_score_science: scores.science,
        ai_score_ethics: scores.ethics,
        ai_score_writing: scores.writing,
        ai_score_timing: scores.timing,
        ai_score_innovation: scores.innovation,
        status: approved ? "published" : "rejected",
      };

      await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updateBody),
      });
    }

    return new Response(JSON.stringify({ 
      approved, 
      rejection_reason: rejectionReason, 
      scores,
      avg_percent: Math.round(avgPercent),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-score-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
