import { jsonSchema } from "./openapi-json-schema.mjs";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import SwaggerParser from "@apidevtools/swagger-parser";
import openapiTS, { astToString } from "openapi-typescript";

const input = new URL("../docs/contracts/openapi.json", import.meta.url);
const output = new URL("../docs/contracts/api.d.ts", import.meta.url);
const specification = JSON.parse(await readFile(input, "utf8"));
await SwaggerParser.validate(structuredClone(specification));
const ids = new Set();
const publicPaths = new Set(["/auth/login", "/auth/csrf", "/health", "/health/live"]);
let operations = 0;
for (const [path, item] of Object.entries(specification.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    assert.ok(operation.operationId, `${method} ${path}: operationId required`);
    assert.ok(!ids.has(operation.operationId), `Duplicate operationId ${operation.operationId}`);
    ids.add(operation.operationId);
    operations++;
    assert.ok(operation["x-implementation-status"], `${path}: distinguish planned and implemented routes`);
    if (!publicPaths.has(path)) {
      assert.ok(operation.security.some((scheme) => "sessionCookie" in scheme), `${path}: session required`);
    }
    if (!["get", "head"].includes(method)) {
      assert.ok(operation.security.some((scheme) => "csrfToken" in scheme), `${path}: CSRF required`);
    }
    if (["patch", "put", "delete"].includes(method)) {
      assert.ok(operation.parameters?.some((param) => param.name === "If-Match" && param.required), `${path}: version precondition required`);
    }
  }
}
const runtimeOutput = new URL("../apps/api/src/http/contract-schemas.json", import.meta.url);
const runtime = JSON.stringify({ $id: "sarvin", components: { schemas: jsonSchema(specification.components.schemas) } }, null, 2) + "\n";
const routesOutput = new URL("../apps/web/src/lib/api-routes.ts", import.meta.url);
const routes = Object.fromEntries(Object.entries(specification.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, operation]) => [operation.operationId, { method: method.toUpperCase(), path }])));
const routesSource = "// Generated from OpenAPI; do not edit.\nexport const routes = " + JSON.stringify(routes, null, 2) + " as const;\n";
const generated = `// Generated from openapi.json by pnpm contracts:generate. Do not edit.\n${astToString(await openapiTS(input))}`;
if (process.argv.includes("--write")) {
  await writeFile(output, generated);
  await writeFile(runtimeOutput, runtime);
  await writeFile(routesOutput, routesSource);
} else {
  assert.equal(await readFile(routesOutput, "utf8"), routesSource, "Frontend routes are stale");
  assert.equal(await readFile(runtimeOutput, "utf8"), runtime, "Runtime schemas are stale");
  assert.equal(await readFile(output, "utf8"), generated, "Contract types are stale; run pnpm contracts:generate");
}
console.log(`OpenAPI validated: ${operations} operations, ${Object.keys(specification.components.schemas).length} schemas; typed declarations ${process.argv.includes("--write") ? "generated" : "current"}.`);
