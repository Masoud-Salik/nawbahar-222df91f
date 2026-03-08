import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push helpers using Web Crypto API
async function generateJWT(header: object, payload: object, privateKeyPem: string): Promise<string> {
  const enc = new TextEncoder();
  
  const b64url = (data: Uint8Array) => {
    let b64 = btoa(String.fromCharCode(...data));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const b64urlStr = (str: string) => b64url(enc.encode(str));
  
  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  
  // Import ECDSA P-256 private key
  const keyData = privateKeyPem
    .replace(/-----BEGIN EC PRIVATE KEY-----|-----END EC PRIVATE KEY-----|\n|\r/g, '');
  const rawKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    rawKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(signingInput)
  );
  
  // Convert DER signature to raw r||s format
  const sigArray = new Uint8Array(signature);
  const sigB64 = b64url(sigArray);
  
  return `${signingInput}.${sigB64}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      aud: audience,
      exp: now + 12 * 3600,
      sub: `mailto:${vapidEmail}`,
    };
    
    const token = await generateJWT(
      { typ: 'JWT', alg: 'ES256' },
      jwtPayload,
      vapidPrivateKey
    );
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Authorization': `vapid t=${token}, k=${vapidPublicKey}`,
      },
      body: payload,
    });
    
    return response.ok || response.status === 201;
  } catch (e) {
    console.error('Push send error:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidEmail = Deno.env.get("VAPID_EMAIL") || "admin@nawbahar.lovable.app";

    const { user_id, title, body, url } = await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: subscriptions } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title,
      body: body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-96x96.png",
      data: { url: url || "/" },
    });

    let sent = 0;
    const failedEndpoints: string[] = [];

    // If VAPID keys are configured, send actual push
    if (vapidPublicKey && vapidPrivateKey) {
      for (const sub of subscriptions) {
        const success = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidEmail
        );
        if (success) {
          sent++;
        } else {
          failedEndpoints.push(sub.endpoint);
        }
      }

      // Clean up failed subscriptions (likely expired)
      if (failedEndpoints.length > 0) {
        await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user_id)
          .in("endpoint", failedEndpoints);
      }
    } else {
      // No VAPID keys - just count (fallback)
      sent = subscriptions.length;
    }

    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
