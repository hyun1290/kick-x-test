import { authenticatedClient, failure, HttpError, json, readJson, requireOrigin } from "@/server/kickx/http";
import { requireAdmin, createAdminDatabase } from "@/server/kickx/admin-db";
import { asObject, checkDatabase, identity } from "@/server/kickx/prototype";
import { calculatePlayer } from "@/server/kickx/engine/service";
export const maxDuration=60;
export async function POST(request:Request){try{
 requireOrigin(request);const user=await requireAdmin();const body=asObject(await readJson(request));const {client}=await authenticatedClient();
 if(body.action==="initialize"||body.action==="rankings"){const r=await client.rpc(body.action==="initialize"?"kickx_initialize_market":"kickx_refresh_rankings");checkDatabase(r.error);return json(r.data);}
 if(body.action==="name"){const r=await client.rpc("kickx_save_player_name",{p_player:identity(body.playerId),p_name:body.displayName,p_aliases:body.aliases});checkDatabase(r.error);return json({saved:true});}
 if(body.action==="moderate"){const r=await client.rpc("kickx_moderate",{p_report:identity(body.reportId,true),p_action:body.operation,p_reason:body.reason});checkDatabase(r.error);return json(r.data);}
 if(body.action==="calculate"||body.action==="preview")return json(await calculatePlayer(createAdminDatabase(),identity(body.playerId),user.id,body.action==="preview"));
 if(body.action==="batch"){
  const db=createAdminDatabase();let query=db.from("players").select("id").eq("provider","bsd").not("position","is",null).order("id").limit(2);if(body.cursor)query=query.gt("id",identity(body.cursor));const r=await query;checkDatabase(r.error);
  if(!r.data?.length)return json({done:true,cursor:body.cursor??null,results:[]});
  const result=await calculatePlayer(db,r.data[0].id,user.id);return json({done:r.data.length<2,cursor:r.data[0].id,results:[result]});
 }
 throw new HttpError(400,"지원하지 않는 작업입니다.");
}catch(error){return failure(error);}}
