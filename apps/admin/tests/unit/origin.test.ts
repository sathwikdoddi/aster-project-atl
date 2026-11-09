import assert from "node:assert/strict";
import test from "node:test";
import { checkOrigin } from "../../src/server/auth";

test("origin checks use the browser destination and reject cross-origin writes", () => {
  const previous = process.env.ADMIN_ORIGIN;
  const request = (origin: string) =>
    new Request("http://localhost:3001/api/session", {
      headers: { host: "127.0.0.1:3001", origin },
    });
  try {
    delete process.env.ADMIN_ORIGIN;
    assert.doesNotThrow(() => checkOrigin(request("http://127.0.0.1:3001")));
    assert.throws(() => checkOrigin(request("https://untrusted.example")));
    process.env.ADMIN_ORIGIN = "https://admin.example";
    assert.doesNotThrow(() => checkOrigin(request("https://admin.example")));
    assert.throws(() => checkOrigin(request("http://127.0.0.1:3001")));
  } finally {
    if (previous === undefined) delete process.env.ADMIN_ORIGIN;
    else process.env.ADMIN_ORIGIN = previous;
  }
});
