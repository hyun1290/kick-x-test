import { authenticatedClient, failure, json, readJson, requireOrigin } from "@/server/kickx/http";
import { asObject, checkDatabase, identity } from "@/server/kickx/prototype";
export async function POST(request:Request){try{requireOrigin(request);const {client}=await authenticatedClient();const body=asObject(await readJson(request));const playerId=identity(body.playerId);const {data,error}=await client.rpc("kickx_quote",{p_player:playerId,p_side:body.side});checkDatabase(error);return json(data);}catch(error){return failure(error);}}
