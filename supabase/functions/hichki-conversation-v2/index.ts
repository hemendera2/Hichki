import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}});

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  try{
    const authHeader=req.headers.get('Authorization');
    if(!authHeader)throw Error('not_authenticated');
    const url=Deno.env.get('SUPABASE_URL')!;
    const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
    const caller=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
    const {data:{user},error}=await caller.auth.getUser();
    if(error||!user)throw Error('not_authenticated');
    const body=await req.json();
    const otherUserId=typeof body?.other_user_id==='string'?body.other_user_id:'';
    if(!otherUserId||otherUserId===user.id)throw Error('invalid_recipient');
    const {data:conversationId,error:rpcError}=await caller.rpc('hichki_create_direct',{p_other_user_id:otherUserId});
    if(rpcError)throw rpcError;
    return json({ok:true,conversation_id:conversationId});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    const status=message.includes('not_authenticated')?401:message.includes('recipient_not_found')?404:400;
    return json({ok:false,error:message},status);
  }
});
