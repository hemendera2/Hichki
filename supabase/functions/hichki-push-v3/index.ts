import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const enc = (s: string) => new TextEncoder().encode(s);
const b64url = (value: Uint8Array | string) => {
  const bytes = typeof value === "string" ? enc(value) : value;
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

async function signRs256(input: string, pem: string) {
  const raw = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", raw, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc(input))));
}

async function getFcmAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const assertion = `${header}.${payload}.${await signRs256(`${header}.${payload}`, privateKey)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`FCM OAuth failed: ${response.status}`);
  const json = await response.json();
  if (!json.access_token) throw new Error("FCM OAuth response did not contain an access token");
  return json.access_token as string;
}

async function sendFcm(tokens: string[], title: string, body: string, data: Record<string, string>, accessToken: string, projectId: string) {
  let sent = 0;
  for (const token of tokens) {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data,
          android: { notification: { channel_id: "hichki_messages", sound: "default" } },
          apns: { payload: { aps: { sound: "default", badge: 1 } } },
        },
      }),
    });
    if (response.ok) sent++;
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "POST required" }), { status: 405, headers: { ...cors, "content-type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) throw new Error("Supabase function secrets are unavailable");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRole, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Authenticated user required");
    const callerId = userData.user.id;

    const input = await req.json();
    const conversationId = String(input.conversation_id ?? "");
    const title = String(input.title ?? "Hichki").slice(0, 80);
    const body = String(input.body ?? "New message").slice(0, 240);
    const data = Object.fromEntries(Object.entries(input.data ?? {}).map(([k, v]) => [String(k), String(v)]));
    if (!conversationId) throw new Error("conversation_id required");

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: members, error: memberError } = await admin.from("conversation_members").select("user_id").eq("conversation_id", conversationId);
    if (memberError) throw memberError;
    const memberIds = (members ?? []).map((row) => row.user_id as string);
    if (!memberIds.includes(callerId)) throw new Error("Caller is not a conversation member");

    const recipientIds = memberIds.filter((id) => id !== callerId);
    if (!recipientIds.length) return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...cors, "content-type": "application/json" } });

    const { data: devices, error: deviceError } = await admin.from("push_subscriptions").select("user_id,device_id,platform,token").in("user_id", recipientIds);
    if (deviceError) throw deviceError;

    const fcmProject = Deno.env.get("FCM_PROJECT_ID");
    const fcmEmail = Deno.env.get("FCM_CLIENT_EMAIL");
    const fcmKey = Deno.env.get("FCM_PRIVATE_KEY")?.replace(/\\n/g, "\n");
    if (!fcmProject || !fcmEmail || !fcmKey) {
      return new Response(JSON.stringify({ ok: false, configured: false, reason: "FCM secrets are not configured" }), { status: 503, headers: { ...cors, "content-type": "application/json" } });
    }

    const tokens = (devices ?? []).filter((row) => row.platform === "android" || row.platform === "ios").map((row) => row.token as string);
    if (!tokens.length) return new Response(JSON.stringify({ ok: true, sent: 0, registered_devices: 0 }), { headers: { ...cors, "content-type": "application/json" } });

    const accessToken = await getFcmAccessToken(fcmEmail, fcmKey);
    const sent = await sendFcm(tokens, title, body, data, accessToken, fcmProject);
    return new Response(JSON.stringify({ ok: sent > 0, sent, attempted: tokens.length }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }
});
