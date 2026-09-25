import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import ts from "typescript";
// Compile only the two pure demo modules with the project's existing TypeScript.
function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loaded = { exports: {} };
  runInThisContext(`(function(require,module,exports){${outputText}\n})`)(
    (id) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`);
      return dependencies[id];
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const data = load("../lib/kickx/data.ts");
const {
  demoReducer: reduce,
  initialState,
  restoreDemo,
  DEMO_SELL_FEE,
} = load("../lib/kickx/store.ts", { "./data": data });
const fresh = () => structuredClone(initialState);
const buy = (id, requestId = "request-1") => ({
  type: "TRADE",
  id,
  side: "buy",
  requestId,
  date: "2026-09-25T12:00:00Z",
});
const sell = (id) => ({ ...buy(id), side: "sell" });
test("buy updates points, holdings and history together; duplicate request does not double spend", () => {
  const before = fresh(),
    after = reduce(before, buy("yamal"));
  assert.equal(after.points, before.points - data.getPlayer("yamal").price);
  assert.equal(after.holdings.length, before.holdings.length + 1);
  assert.equal(after.transactions[0].playerId, "yamal");
  assert.deepEqual(reduce(after, buy("yamal")), after);
  assert.equal(before.holdings.length, 11);
});
test("insufficient funds leave all asset fields unchanged", () => {
  const before = { ...fresh(), points: 1 },
    after = reduce(before, buy("yamal"));
  assert.equal(after.noticeKind, "error");
  for (const key of ["points", "holdings", "transactions", "squad"])
    assert.deepEqual(after[key], before[key]);
});
test("unowned sales, duplicate ownership and suspended players are rejected", () => {
  for (const action of [sell("yamal"), buy("haaland"), buy("musiala")]) {
    const before = fresh(),
      after = reduce(before, action);
    assert.equal(after.noticeKind, "error");
    assert.deepEqual(after.transactions, before.transactions);
    assert.equal(after.points, before.points);
  }
});
test("sale deducts the fee, removes ownership and clears the squad slot", () => {
  const before = fresh(),
    after = reduce(before, sell("haaland")),
    price = data.getPlayer("haaland").price;
  assert.equal(
    after.points,
    before.points + price - Math.floor(price * DEMO_SELL_FEE),
  );
  assert.ok(!after.holdings.some((h) => h.playerId === "haaland"));
  assert.ok(!after.squad.includes("haaland"));
  assert.equal(after.transactions[0].fee, 304);
  assert.equal(after.transactions[0].net, 14896);
});
test("invalid positions, duplicated players, unowned players and oversized squads cannot replace saved squad", () => {
  const before = fresh();
  const invalid = [
    ["alisson", ...before.squad.slice(1)],
    ["haaland", ...before.squad.slice(1)],
    ["yamal", ...before.squad.slice(1)],
    [...before.squad, "saka"],
  ];
  for (const slots of invalid) {
    const after = reduce(before, { type: "SQUAD", formation: "4-3-3", slots });
    assert.equal(after.noticeKind, "error");
    assert.deepEqual(after.squad, before.squad);
  }
  const valid = reduce(before, {
    type: "SQUAD",
    formation: "4-3-3",
    slots: [null, ...before.squad.slice(1)],
  });
  assert.equal(valid.squad[0], null);
});
test("club posts/comments require the supported club and attachments require owned transactions", () => {
  const before = fresh();
  const post = {
    ...data.initialPosts[0],
    id: "new",
    authorId: "me",
    target: "real-madrid",
  };
  assert.equal(reduce(before, { type: "POST", post }).noticeKind, "error");
  const validPost = {
    ...post,
    target: "arsenal",
    transaction: { ...before.transactions[0], id: "someone-elses-trade" },
  };
  assert.equal(
    reduce(before, { type: "POST", post: validPost }).noticeKind,
    "error",
  );
  const after = reduce(before, {
    type: "POST",
    post: { ...validPost, transaction: before.transactions[0] },
  });
  assert.equal(after.posts[0].id, "new");
  const comment = {
    id: "new-c",
    postId: "post-4",
    authorId: "me",
    author: "me",
    body: "hello",
    date: "2026-09-25",
  };
  assert.equal(
    reduce(before, { type: "COMMENT", comment }).noticeKind,
    "error",
  );
});
test("only the author can edit an existing comment", () => {
  const before = fresh();
  const after = reduce(before, {
    type: "COMMENT",
    comment: { ...before.comments[0], body: "overwritten", authorId: "me" },
  });
  assert.equal(after.noticeKind, "error");
  assert.deepEqual(after.comments, before.comments);
});
test("logout blocks trades; logging in again does not grant more points", () => {
  const before = fresh(),
    out = reduce(before, { type: "LOGOUT" }),
    attempt = reduce(out, buy("yamal"));
  assert.equal(attempt.noticeKind, "error");
  assert.equal(attempt.points, before.points);
  assert.equal(reduce(out, { type: "LOGIN" }).points, before.points);
});
test("moderation updates content visibility and records an audit event", () => {
  const state = reduce(fresh(), {
    type: "MODERATE",
    id: "report-1",
    status: "숨김",
    date: "2026-09-25",
  });
  assert.equal(state.posts.find((p) => p.id === "post-2").hidden, true);
  assert.equal(state.audit.length, 1);
  assert.equal(
    reduce(state, {
      type: "MODERATE",
      id: "report-1",
      status: "기각",
      date: "2026-09-25",
    }).posts.find((p) => p.id === "post-2").hidden,
    false,
  );
});
test("stored state can be restored; corrupt or obsolete storage is ignored", () => {
  assert.equal(
    restoreDemo(JSON.stringify(fresh())).points,
    initialState.points,
  );
  for (const raw of [
    null,
    "{broken",
    "{}",
    JSON.stringify({ ...fresh(), version: 9 }),
    JSON.stringify({ ...fresh(), points: -1 }),
    JSON.stringify({ ...fresh(), profile: { nickname: "X", team: "missing" } }),
  ])
    assert.equal(restoreDemo(raw), undefined);
});
