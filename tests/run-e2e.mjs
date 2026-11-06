// Builds and starts the app against DATABASE_URL, then runs the e2e tests.
import { spawn, spawnSync } from "node:child_process";

const PORT = process.env.TEST_PORT || "3100";
const BASE = `http://localhost:${PORT}`;
const env = {
  ...process.env,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || BASE,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "test-secret",
  TEST_BASE_URL: BASE,
};
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const run = (args) => {
  const r = spawnSync(npx, args, { stdio: "inherit", env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(["prisma", "db", "push", "--skip-generate"]);
if (!process.env.SKIP_BUILD) run(["next", "build"]);

const server = spawn(npx, ["next", "start", "-p", PORT], {
  stdio: "inherit",
  env,
  detached: true,
});
const stop = () => {
  try {
    process.kill(-server.pid);
  } catch {}
};

let code = 1;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${BASE}/login`)).ok) break;
    } catch {}
    if (i > 60) throw new Error("server did not start");
    await new Promise((r) => setTimeout(r, 1000));
  }
  const t = spawnSync(process.execPath, ["tests/post-visibility.e2e.mjs"], {
    stdio: "inherit",
    env,
  });
  code = t.status ?? 1;
} catch (e) {
  console.error(e);
} finally {
  stop();
}
process.exit(code);
