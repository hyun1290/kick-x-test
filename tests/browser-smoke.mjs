import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadTs } from "./load-ts.mjs";
const { chromium } = await import(pathToFileURL(resolve(process.env.KICKX_BROWSER_MODULE || "/tmp/kickx-browser", "node_modules/playwright/index.mjs")).href);
// NextRequest normalizes loopback IPs to localhost. Use the same canonical origin.
const base = "http://localhost:3100";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next","start","-H","localhost","-p","3100"], {stdio:["ignore","pipe","pipe"]});
let output = "";
server.stdout.on("data", chunk => {output += chunk;});
server.stderr.on("data", chunk => {output += chunk;});
let browser;
const report = {routes:[],checks:[]};
const errors = [];
try {
  for(let i=0;i<60;i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    if(i===59) throw new Error("App did not start");
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  await mkdir("test-artifacts",{recursive:true});
  browser = await chromium.launch();
  const context=await browser.newContext();
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  const routes=["/","/login","/onboarding","/players","/players/missing","/market","/portfolio","/transactions","/squad","/ranking","/community","/community/clubs","/community/players","/community/clubs/missing","/community/players/missing","/community/posts/missing","/community/write","/mypage","/admin","/admin/data","/admin/trades","/admin/community","/fixtures"];
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    for(const path of routes) {
      const response=await page.goto(base+path,{waitUntil:"networkidle"});
      assert.ok(response?.ok(),path+" did not load");
      const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
      assert.ok(size.scroll<=size.width+1,path+" overflows at "+viewport.width+": "+size.scroll);
      report.routes.push({path,width:viewport.width});
      if(["/","/fixtures","/players","/squad","/login"].includes(path)) await page.screenshot({path:"test-artifacts/"+(path==="/"?"home":path.slice(1))+"-"+viewport.width+".png",fullPage:true});
    }
  }
  await page.goto(base,{waitUntil:"networkidle"});
  await page.getByRole("button",{name:"지표 읽는 법",exact:true}).click();
  assert.ok(await page.getByRole("dialog").isVisible());
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(),0);
  report.checks.push("Guide opens and closes with Escape");
  await page.getByLabel("선수 이름 검색",{exact:true}).fill("not-present");
  await page.locator(".yb-search-button").click();
  assert.ok(await page.getByText("검색 결과", {exact:false}).count());
  await page.getByRole("button",{name:/필터 초기화/}).click();
  assert.equal(await page.getByLabel("선수 이름 검색",{exact:true}).inputValue(),"");
  report.checks.push("Home search and reset");
  await page.goto(base+"/login",{waitUntil:"networkidle"});
  assert.equal(await page.getByRole("button",{name:"Google로 계속하기"}).isDisabled(),true);
  const status=await context.request.get(base+"/api/auth/status");
  assert.equal((await status.json()).enabled,false);
  const denied=await context.request.put(base+"/api/kickx/watchlist",{data:{playerId:"test-player",watched:true}});
  assert.equal(denied.status(),403);
  const disconnected=await context.request.put(base+"/api/kickx/watchlist",{headers:{origin:base},data:{playerId:"test-player",watched:true}});
  assert.equal(disconnected.status(),503);
  report.checks.push("Disconnected services and cross-origin writes stay blocked");
  for(const endpoint of ["/api/kickx/players?page=0","/api/kickx/fixtures?day=2026-02-30"]) {
    assert.equal((await context.request.get(base+endpoint)).status(),400);
  }
  for(const endpoint of ["/api/kickx/players","/api/kickx/fixtures","/api/kickx/players/missing"]) {
    assert.equal((await (await context.request.get(base+endpoint)).json()).status,"not-configured");
  }
  report.checks.push("Catalog API validates parameters and keeps disconnected reads explicit");
  await context.close();

  // UI-only injected responses: these records never ship in application data or SQL seeds.
  const mock=await browser.newContext({viewport:{width:1440,height:1000}});
  const mockPage=await mock.newPage();
  mockPage.on("pageerror",error=>errors.push(error.message));
  const empty=loadTs("../lib/kickx/data.ts").emptyPlatformData();
  const state={...empty,
    players:[{id:"test-player",name:"CI-only player",english:null,short:null,team:null,position:"FW",number:null,country:null,age:null,price:0,change:0,performance:0,volume:0,goals:0,assists:0,minutes:0,history:[],records:[],analysis:null,updatedAt:null,status:null}],
    session:{userId:"test-account",role:"member",profile:{nickname:"테스트 사용자",team:null}},
    member:{financialReady:false,points:null,totalAssets:null,playerAssets:null,profit:null,returnRate:null,weeklyRank:null,holdings:[],transactions:[],watchlist:[],assetHistory:[],squad:null},
  };
  await mock.route(/\/api\/kickx$/,route=>route.fulfill({json:{status:"ready",data:state}}));
  const catalogRequests=[];
  let failSearch=false;
  const extra=Array.from({length:24},(_,i)=>({...state.players[0],id:"catalog-"+i,name:"목록 선수 "+i}));
  await mock.route(/\/api\/kickx\/players\?/,route=>{
    const url=new URL(route.request().url()),params=url.searchParams;
    catalogRequests.push(url.search);
    if(failSearch) {failSearch=false;return route.fulfill({status:500,json:{error:"테스트 목록 조회 오류"}});}
    const page=Number(params.get("page")||1),size=Number(params.get("size")||12),q=params.get("q")||"";
    let items=q === "서버에서만 조회" ? extra : state.players;
    if(params.get("scope")==="watch") items=items.filter(p=>state.member.watchlist.includes(p.id));
    return route.fulfill({json:{status:"ready",data:{items:items.slice((page-1)*size,page*size),total:items.length,page,size}}});
  });
  await mock.route(/\/api\/kickx\/players\/[^?]+$/,route=>{
    const id=new URL(route.request().url()).pathname.split("/").at(-1);
    return route.fulfill({json:{status:"ready",data:{player:[...state.players,...extra].find(p=>p.id===id)||null}}});
  });
  await mock.route(/\/api\/kickx\/fixtures\?/,route=>{
    const params=new URL(route.request().url()).searchParams;
    return route.fulfill({json:{status:"ready",data:{items:[],total:0,page:Number(params.get("page")||1),size:20}}});
  });
  let watchCalls=0;
  await mock.route("**/api/kickx/watchlist",async route=>{
    watchCalls++;
    const input=route.request().postDataJSON();
    assert.equal(input.userId,undefined);
    if(watchCalls===1) return route.fulfill({status:500,json:{error:"테스트 저장 오류"}});
    state.member.watchlist=input.watched?[input.playerId]:[];
    return route.fulfill({json:input});
  });
  await mockPage.goto(base,{waitUntil:"networkidle"});
  assert.match(await mockPage.locator(".yb-price").innerText(),/^0/);
  const watch=mockPage.getByRole("button",{name:"관심 선수 추가",exact:true});
  await watch.click();
  await mockPage.getByText("테스트 저장 오류",{exact:true}).waitFor();
  assert.equal(await watch.getAttribute("aria-pressed"),"false");
  await watch.click();
  await mockPage.getByRole("button",{name:"관심 선수 해제",exact:true}).first().waitFor();
  assert.deepEqual(state.member.watchlist,["test-player"]);
  report.checks.push("Zero price renders; failed watchlist writes do not pretend to succeed");
  await mockPage.goto(base+"/players?watchlist=1",{waitUntil:"networkidle"});
  assert.ok(await mockPage.getByRole("heading",{name:"CI-only player",exact:true}).isVisible());
  report.checks.push("Saved watchlist feeds the filtered player list");
  await mockPage.getByRole("button",{name:"전체 선수",exact:true}).click();
  await mockPage.getByLabel("선수 검색",{exact:true}).fill("서버에서만 조회");
  await mockPage.getByRole("heading",{name:"목록 선수 0",exact:true}).waitFor();
  await mockPage.getByRole("button",{name:"다음 페이지",exact:true}).click();
  await mockPage.getByRole("heading",{name:"목록 선수 12",exact:true}).waitFor();
  assert.ok(catalogRequests.some(url=>url.includes("page=2")));
  await mockPage.getByLabel("선수 검색",{exact:true}).fill("");
  await mockPage.getByRole("heading",{name:"CI-only player",exact:true}).waitFor();
  failSearch=true;
  await mockPage.getByLabel("선수 검색",{exact:true}).fill("서버에서만 조회");
  await mockPage.getByRole("heading",{name:"데이터를 불러오지 못했습니다",exact:true}).waitFor();
  await mockPage.getByRole("button",{name:"다시 시도",exact:true}).click();
  await mockPage.getByRole("heading",{name:"목록 선수 0",exact:true}).waitFor();
  await mockPage.goto(base+"/players/catalog-23",{waitUntil:"networkidle"});
  await mockPage.getByRole("heading",{name:"목록 선수 23",exact:true}).waitFor();
  report.checks.push("Server search, second page, retry and direct detail outside bootstrap");
  await mockPage.goto(base+"/transactions",{waitUntil:"networkidle"});
  const totals=await mockPage.locator(".transaction-stats strong").allTextContents();
  assert.ok(totals.length===3&&totals.every(text=>text.includes("—")));
  assert.ok(await mockPage.getByRole("heading",{name:"거래 내역 정보를 준비하고 있습니다",exact:true}).isVisible());
  report.checks.push("Unconnected finance remains unknown after login");
  let profileCalls=0;
  await mock.route("**/api/kickx/profile",async route=>{
    profileCalls++;
    const input=route.request().postDataJSON();
    assert.equal(input.id,undefined);
    if(profileCalls===1) return route.fulfill({status:409,json:{error:"이미 사용 중인 닉네임입니다."}});
    state.session.profile=input;
    return route.fulfill({json:{profile:input}});
  });
  await mockPage.goto(base+"/mypage",{waitUntil:"networkidle"});
  await mockPage.getByLabel("닉네임",{exact:true}).fill("새 닉네임");
  await mockPage.getByRole("button",{name:"변경사항 저장"}).click();
  await mockPage.getByRole("alert").filter({hasText:"이미 사용 중인 닉네임입니다."}).waitFor();
  assert.equal(await mockPage.getByLabel("닉네임",{exact:true}).inputValue(),"새 닉네임");
  await mockPage.getByRole("button",{name:"변경사항 저장"}).click();
  await mockPage.getByText("프로필을 저장했습니다.",{exact:true}).waitFor();
  assert.ok(await mockPage.getByRole("heading",{name:"새 닉네임",exact:true}).isVisible());
  report.checks.push("Profile errors preserve input; confirmed saves update the account");
  await mock.close();
  assert.deepEqual(errors,[],"Browser JavaScript errors");
  report.checks.push("No browser JavaScript errors");
  await writeFile("test-artifacts/report.json",JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch(error) {
  console.error(output.slice(-8000));
  throw error;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
