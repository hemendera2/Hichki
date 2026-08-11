import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((_req) => new Response(JSON.stringify({ ok: false, error: "legacy_push_endpoint_disabled" }), { status: 410, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } }));
