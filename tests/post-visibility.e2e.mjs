// End-to-end checks for post audience (all users vs. groups). Requires a
// running server; use `npm test`, which starts one via tests/run-e2e.mjs.
const B = process.env.TEST_BASE_URL || "http://localhost:3000";
let fails = 0;
const check = (name, cond) => { console.log((cond ? "PASS " : "FAIL ") + name); if (!cond) fails++; };

async function client(email) {
  const jar = {};
  const f = async (path, init = {}) => {
    const res = await fetch(B + path, { redirect: "manual", ...init,
      headers: { ...(init.headers || {}), cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ") } });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar[kv.slice(0, i)] = kv.slice(i + 1); }
    return res;
  };
  await f("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: email, email, password: "pw123456" }) });
  const { csrfToken } = await (await f("/api/auth/csrf")).json();
  await f("/api/auth/callback/credentials", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email, password: "pw123456", json: "true" }) });
  const s = await (await f("/api/auth/session")).json();
  if (!s?.user?.id) throw new Error("login failed " + email);
  const json = (path, method, body) => f(path, { method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
  return { f, json, id: s.user.id };
}

const t = Date.now();
const alice = await client(`alice${t}@x.test`), bob = await client(`bob${t}@x.test`), carol = await client(`carol${t}@x.test`);
const forum = await (await alice.json("/api/forums", "POST", { name: "F" + t })).json();
const g = await (await alice.json("/api/groups", "POST", { name: "Hui" + t })).json();
const g2 = await (await carol.json("/api/groups", "POST", { name: "Other" + t })).json();
check("duplicate group name rejected", (await alice.json("/api/groups", "POST", { name: "Hui" + t })).status === 409);
check("bob joins group", (await bob.f(`/api/groups/${g.id}/membership`, { method: "POST" })).ok);
const mine = await (await alice.f("/api/groups?mine=true")).json();
check("alice's groups list contains hui", mine.some(x => x.id === g.id && x.isMember));

const pub = await (await alice.json("/api/posts", "POST", { title: "PUB" + t, content: "<p>x</p>", forumId: forum.id })).json();
check("default visibility is PUBLIC", pub.visibility === "PUBLIC");
const grp = await (await alice.json("/api/posts", "POST", { title: "GRP" + t, content: "<p>secret</p>", forumId: forum.id, visibility: "GROUPS", groupIds: [g.id] })).json();
check("group post created", grp.visibility === "GROUPS" && grp.groups[0].id === g.id);
check("GROUPS with no groups rejected", (await alice.json("/api/posts", "POST", { title: "x", content: "x", forumId: forum.id, visibility: "GROUPS", groupIds: [] })).status === 400);
check("post to non-member group rejected", (await alice.json("/api/posts", "POST", { title: "x", content: "x", forumId: forum.id, visibility: "GROUPS", groupIds: [g2.id] })).status === 400);
check("invalid visibility rejected", (await alice.json("/api/posts", "POST", { title: "x", content: "x", forumId: forum.id, visibility: "SECRET" })).status === 400);

const page = async (c, p) => { const r = await c.f(p); return { status: r.status, body: await r.text() }; };
for (const [who, c, sees] of [["alice", alice, true], ["bob", bob, true], ["carol", carol, false]]) {
  const fp = await page(c, `/forums/${forum.id}`);
  check(`${who} forum page shows public post`, fp.body.includes("PUB" + t));
  check(`${who} forum page ${sees ? "shows" : "hides"} group post`, fp.body.includes("GRP" + t) === sees);
  const pp = await page(c, `/forums/${forum.id}/posts/${grp.id}`);
  check(`${who} group post page ${sees ? "200" : "404"}`, pp.status === (sees ? 200 : 404));
  const sr = await (await c.f(`/api/search?query=${t}`)).json();
  check(`${who} search ${sees ? "includes" : "excludes"} group post`, sr.some(p => p.id === grp.id) === sees);
  const cm = await c.json("/api/comments", "POST", { content: "hi", postId: grp.id });
  check(`${who} comment on group post ${sees ? "allowed" : "blocked"}`, sees ? cm.ok : cm.status === 404);
}
const fl = await page(carol, "/forums");
check("forums index hides group post from carol", !fl.body.includes("GRP" + t));
const np = await page(alice, `/forums/${forum.id}/new-post`);
check("new-post page renders audience picker", np.body.includes("Who can see this post?") && np.body.includes("Hui" + t));
check("forum page links to new-post", (await page(alice, `/forums/${forum.id}`)).body.includes(`/forums/${forum.id}/new-post`));
check("groups page renders", (await page(bob, "/groups")).body.includes("Hui" + t));

// Edit: switch to public, then back to groups
check("non-author cannot edit", (await bob.json("/api/posts", "PUT", { id: grp.id, title: "h", content: "h", visibility: "PUBLIC" })).status === 403);
const up = await (await alice.json("/api/posts", "PUT", { id: grp.id, title: "GRP" + t, content: "c", visibility: "PUBLIC" })).json();
check("edit to PUBLIC clears groups", up.visibility === "PUBLIC" && up.groups.length === 0);
check("carol now sees post", (await page(carol, `/forums/${forum.id}/posts/${grp.id}`)).status === 200);
await alice.json("/api/posts", "PUT", { id: grp.id, title: "GRP" + t, content: "c", visibility: "GROUPS", groupIds: [g.id] });
check("carol hidden again", (await page(carol, `/forums/${forum.id}/posts/${grp.id}`)).status === 404);
const ep = await page(alice, `/forums/${forum.id}/posts/${grp.id}/edit`);
check("edit page renders audience picker", ep.body.includes("Who can see this post?"));
const before = (await page(bob, `/forums/${forum.id}/posts/${grp.id}`)).status;
await bob.f(`/api/groups/${g.id}/membership`, { method: "DELETE" });
check("bob loses access after leaving", before === 200 && (await page(bob, `/forums/${forum.id}/posts/${grp.id}`)).status === 404);
check("delete still works", (await alice.f(`/api/posts?id=${pub.id}`, { method: "DELETE" })).ok);
console.log(fails ? `${fails} FAILED` : "ALL PASSED");
process.exit(fails ? 1 : 0);
