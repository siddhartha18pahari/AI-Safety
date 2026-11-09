import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isDecidionHealthBody, probeApiHealth } from "./health.ts";

const spaHtml = "<!doctype html><html><head><title>Decidion</title></head><body><div id=\"root\"></div></body></html>";

function jsonResponse(body: unknown, status = 200, contentType = "application/json") {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

describe("isDecidionHealthBody", () => {
  it("accepts the API health schema", () => {
    assert.equal(isDecidionHealthBody('{"status":"ok","service":"decidion"}'), true);
  });

  it("rejects malformed JSON and the wrong schema", () => {
    assert.equal(isDecidionHealthBody("<!doctype html>"), false);
    assert.equal(isDecidionHealthBody(""), false);
    assert.equal(isDecidionHealthBody("null"), false);
    assert.equal(isDecidionHealthBody('{"status":"ok"}'), false);
    assert.equal(isDecidionHealthBody('{"status":"ok","service":"other"}'), false);
    assert.equal(isDecidionHealthBody('{"status":"down","service":"decidion"}'), false);
    assert.equal(isDecidionHealthBody('["ok","decidion"]'), false);
  });
});

describe("probeApiHealth", () => {
  it("treats a 200 HTML SPA fallback as down", async () => {
    const fetchImpl: typeof fetch = async () => new Response(spaHtml, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    assert.equal(await probeApiHealth("/api/health", fetchImpl), false);
  });

  it("treats invalid JSON and a non-matching schema as down", async () => {
    const invalid: typeof fetch = async () => jsonResponse("{not json", 200);
    const missingField: typeof fetch = async () => jsonResponse({ status: "ok" });
    const wrongService: typeof fetch = async () => jsonResponse({ status: "ok", service: "vercel" });
    assert.equal(await probeApiHealth("/api/health", invalid), false);
    assert.equal(await probeApiHealth("/api/health", missingField), false);
    assert.equal(await probeApiHealth("/api/health", wrongService), false);
  });

  it("treats the real health payload as up", async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ status: "ok", service: "decidion" });
    assert.equal(await probeApiHealth("http://127.0.0.1:8000/health", fetchImpl), true);
  });

  it("treats non-2xx and network failure as down", async () => {
    const unavailable: typeof fetch = async () => jsonResponse({ status: "ok", service: "decidion" }, 503);
    const offline: typeof fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    assert.equal(await probeApiHealth("/api/health", unavailable), false);
    assert.equal(await probeApiHealth("/api/health", offline), false);
  });
});
