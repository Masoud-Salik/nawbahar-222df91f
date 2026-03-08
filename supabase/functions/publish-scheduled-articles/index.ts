import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    const { data: articles, error: fetchError } = await supabase
      .from("articles")
      .select("id, title, author_id")
      .eq("status", "pending")
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let published = 0;
    let notificationsSent = 0;

    for (const article of articles) {
      const { error: updateError } = await supabase
        .from("articles")
        .update({ status: "published" })
        .eq("id", article.id);

      if (updateError) continue;
      published++;
      console.log(`Published: ${article.title} (${article.id})`);

      // Get author display name
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", article.author_id)
        .single();

      const authorName = authorProfile?.display_name || "نویسنده";

      // Get all followers of this author
      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", article.author_id);

      if (!followers || followers.length === 0) continue;

      // Send push notification to each follower
      for (const follower of followers) {
        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: follower.follower_id,
          actor_id: article.author_id,
          type: "new_article",
          article_id: article.id,
        });

        // Send push notification via edge function
        try {
          const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_id: follower.follower_id,
              title: `مقاله جدید از ${authorName}`,
              body: article.title,
              url: `/article/${article.id}`,
            }),
          });
          if (pushRes.ok) notificationsSent++;
        } catch (e) {
          console.error("Push error for follower:", follower.follower_id, e);
        }
      }
    }

    return new Response(JSON.stringify({ published, notificationsSent, total: articles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
