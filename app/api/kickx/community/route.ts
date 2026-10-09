import { authenticatedClient, failure, HttpError, json, readJson, requireOrigin } from "@/server/kickx/http";
import { asObject, checkDatabase, identity, CATEGORIES, migrationMissing } from "@/server/kickx/prototype";
import { createRequestClient } from "@/server/kickx/supabase";
import { getSupabaseConfig } from "@/server/kickx/config";
import { validatePost } from "@/lib/kickx/validation";
export async function GET(request:Request){try{
 const p=new URL(request.url).searchParams;const postId=p.get("postId");
 const unavailable={status:"not-configured",data:postId?{post:null,comments:[]}:{items:[],total:0,page:1,size:20}};
 if(!getSupabaseConfig())return json(unavailable);
 const client=await createRequestClient();
 const query=postId?client.rpc("kickx_post_detail",{p_id:identity(postId,true),p_page:Number(p.get("page")||1)}):client.rpc("kickx_posts",{p_scope:p.get("scope"),p_target:p.get("target"),p_query:p.get("q")||"",p_category:p.get("category"),p_sort:p.get("sort")||"new",p_page:Number(p.get("page")||1),p_size:20});
 const {data,error}=await query;if(migrationMissing(error))return json(unavailable);checkDatabase(error);return json({status:"ready",data});
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
 requireOrigin(request);const {client,user}=await authenticatedClient();const input=asObject(await readJson(request));const action=input.action;
 if(typeof action!=="string")throw new HttpError(400,"요청을 확인해 주세요.");
 if(action==="createPost"||action==="editPost"){
  for(const field of ["scope","target","title","body","category","transaction"])if(typeof input[field]!=="string")throw new HttpError(400,"글 내용을 확인해 주세요.");
  const profile=await client.from("profiles").select("team_id").eq("id",user.id).maybeSingle();checkDatabase(profile.error);
  const target=await client.from(input.scope==="club"?"teams":"players").select("id").eq("id",identity(input.target)).maybeSingle();checkDatabase(target.error);
  const errors=validatePost(input as unknown as Parameters<typeof validatePost>[0],{myTeam:profile.data?.team_id??null,categories:CATEGORIES,targets:target.data?[target.data.id]:[],transactions:input.transaction?[String(input.transaction)]:[]});
  if(Object.keys(errors).length)throw new HttpError(400,Object.values(errors).join(" "));
 }
 const {data,error}=await client.rpc("kickx_community_write",{p_action:action,p_input:input});checkDatabase(error);return json(data);
}catch(error){return failure(error);}}
