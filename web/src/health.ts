/** Body returned by GET /health on this API. */
export const DECIDION_HEALTH = { status: "ok", service: "decidion" } as const;

/**
 * True only for the JSON object this API returns from /health.
 * HTML, empty bodies, and nearby-but-wrong objects are false.
 */
export function isDecidionHealthBody(body: string): boolean {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return false;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.status === DECIDION_HEALTH.status && record.service === DECIDION_HEALTH.service;
}

function isHtml(contentType: string | null): boolean {
  return (contentType ?? "").toLowerCase().includes("text/html");
}

/**
 * The API is up only when the response is 2xx, is not an HTML document,
 * and the body matches the /health schema. Network errors and non-JSON are down.
 */
export async function probeApiHealth(url: string, fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetchImpl(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok || isHtml(response.headers.get("content-type"))) return false;
    return isDecidionHealthBody(await response.text());
  } catch {
    return false;
  }
}
