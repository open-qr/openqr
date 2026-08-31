// End-to-end check: drive mcp/index.js over stdio exactly as a client would.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const key = process.env.OPENQR_API_KEY;
if (!key) {
  console.error("set OPENQR_API_KEY");
  process.exit(1);
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["index.js"],
  env: { ...process.env, OPENQR_API_KEY: key },
  stderr: "pipe",
});
const client = new Client({ name: "shim-verify", version: "1.0.0" });

const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
  if (!ok) failures.push(name);
};

try {
  await client.connect(transport, { timeout: 20000 });

  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  check("tools/list", tools.tools.length === 17, `${tools.tools.length} tools`);
  check(
    "expected tool names present",
    ["generate_qr", "create_dynamic_qr", "get_scans", "set_subdomain"].every((n) =>
      names.includes(n)
    ),
    names.join(",")
  );

  const prompts = await client.listPrompts().catch((e) => ({ prompts: [], e: String(e) }));
  check("prompts/list", (prompts.prompts ?? []).length > 0, `${(prompts.prompts ?? []).length} prompts`);

  const resources = await client.listResources().catch((e) => ({ resources: [], e: String(e) }));
  check("resources/list", (resources.resources ?? []).length > 0, `${(resources.resources ?? []).length} resources`);

  const gen = await client.callTool({
    name: "generate_qr",
    arguments: { data: "https://openqr.uk", size: 256 },
  });
  const genText = (gen.content ?? []).map((c) => c.text ?? "").join(" ");
  const genImage = (gen.content ?? []).find((c) => c.type === "image");
  check(
    "generate_qr returns content",
    !gen.isError && (genText.length > 20 || (genImage?.data?.length ?? 0) > 100),
    genImage
      ? `image ${genImage.mimeType}, ${Math.round((genImage.data.length * 3) / 4 / 1024)}KB`
      : genText.slice(0, 120)
  );

  const bad = await client.callTool({
    name: "list_dynamic_qr",
    arguments: { limit: 3 },
  });
  const badText = (bad.content ?? []).map((c) => c.text ?? "").join(" ");
  check("authenticated dynamic call", !bad.isError, badText.slice(0, 120));
} catch (e) {
  check("session completed", false, String(e));
} finally {
  await client.close();
}

process.exit(failures.length ? 1 : 0);
