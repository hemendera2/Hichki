import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), { status: 405, headers: { ...cors, "content-type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("not_authenticated");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("not_authenticated");

    const body = await req.json();
    const otherUserId = typeof body?.other_user_id === "string" ? body.other_user_id : "";
    if (!otherUserId || otherUserId === user.id) throw new Error("invalid_recipient");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: recipient, error: recipientError } = await admin.auth.admin.getUserById(otherUserId);
    if (recipientError || !recipient.user) throw new Error("recipient_not_found");

    const { data: mine } = await admin.from("conversation_members").select("conversation_id").eq("user_id", user.id);
    const candidateIds = (mine ?? []).map((row) => row.conversation_id);
    if (candidateIds.length) {
      const { data: theirs } = await admin.from("conversation_members").select("conversation_id").eq("user_id", otherUserId).in("conversation_id", candidateIds);
      const shared = new Set((theirs ?? []).map((row) => row.conversation_id));
      for (const id of candidateIds) {
        if (!shared.has(id)) continue;
        const { data: members } = await admin.from("conversation_members").select("user_id").eq("conversation_id", id);
        if ((members ?? []).length === 2 && new Set((members ?? []).map((row) => row.user_id)).size === 2) {
          return new Response(JSON.stringify({ ok: true, conversation_id: id, created: false }), { headers: { ...cors, "content-type": "application/json" } });
        }
      }
    }

    const { data: conversation, error: conversationError } = await admin.from("conversations").insert({ kind: "direct" }).select("id").single();
    if (conversationError || !conversation) throw conversationError ?? new Error("conversation_create_failed");
    const { error: membersError } = await admin.from("conversation_members").insert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);
    if (membersError) {
      await admin.from("conversations").delete().eq("id", conversation.id);
      throw membersError;
    }

    return new Response(JSON.stringify({ ok: true, conversation_id: conversation.id, created: true }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "not_authenticated" ? 401 : message === "recipient_not_found" ? 404 : 400;
    return new Response(JSON.stringify({ ok: false, error: message }), { status, headers: { ...cors, "content-type": "application/json" } });
  }
});
