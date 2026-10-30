import {createClient} from '@supabase/supabase-js';
import {mkdir,writeFile} from 'node:fs/promises';
import {createFootballClient} from './lib/football.mjs';
import {nameImportFetch} from './lib/korean-catalog.mjs';
const checked=r=>{if(r.error)throw Error('EVIDENCE_DATABASE_RETRY');return r.data;};
async function main(){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const db=createClient(process.env.SUPABASE_URL,key,{global:{fetch:nameImportFetch(key)},auth:{persistSession:false,autoRefreshToken:false}});
 const api=createFootballClient({key:process.env.BSD_API_KEY,budget:15,delay:100,fetchImpl:async(...args)=>{checked(await db.rpc('kickx_reserve_provider_request'));return fetch(...args);}});
 const replies=await Promise.all(['GOAL_BOUNDARY_TIME_AMBIGUOUS','MINUTES_INTERVAL_MISMATCH'].map(reason=>db.from('performance_results').select('fixture_id').eq('status','blocked').contains('warnings',[reason]).order('fixture_id').limit(1)));
 const ids=[...new Set(replies.flatMap(r=>checked(r).map(x=>x.fixture_id)))];
 const matches=[];
 for(const id of ids){
  const [commentary,incidents]=await Promise.all(['commentary/','incidents/'].map(s=>api.get(`/api/v2/events/${id.slice(4)}/${s}`)));
  matches.push({fixtureId:id,commentary,incidents});
 }
 const legacy=await api.get('/api/player-stats/',{event:1});
 const report={checkedAt:new Date().toISOString(),matches,legacy};
 await mkdir('test-artifacts',{recursive:true});await writeFile('test-artifacts/valuation-evidence-probe.json',JSON.stringify(report));
 console.log(JSON.stringify({stage:'evidence-probe',matches:matches.map(m=>({fixtureId:m.fixtureId,keys:Object.keys(m.commentary),lines:m.commentary.commentary?.length,withSeconds:m.commentary.commentary?.filter(l=>l.second!=null).length,sample:m.commentary.commentary?.filter(l=>['goal','substitution','period_end','var','red_card'].includes(l.type)).slice(0,6)})),legacyKeys:Object.keys(legacy),legacySamples:legacy.results?.slice(0,2),requests:api.requests}));
}
main().catch(()=>{console.error('EVIDENCE_PROBE_RETRY');process.exitCode=1;});
