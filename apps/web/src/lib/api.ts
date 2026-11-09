import type { components, operations } from "../../../../docs/contracts/api";
import { routes } from "./api-routes";
export type DTO = components["schemas"];
export type Operation = keyof operations;
type Body<K extends Operation> = operations[K] extends { requestBody?: infer R }
  ? NonNullable<R> extends { content: { "application/json": infer B } }
    ? B
    : never
  : never;
type Parameters<K extends Operation> = operations[K] extends {
  parameters: infer P;
}
  ? P
  : never;
type Path<K extends Operation> =
  Parameters<K> extends { path: infer P } ? P : never;
type Query<K extends Operation> =
  Parameters<K> extends { query?: infer Q } ? Q : never;
type Content<T> = T extends { content: { "application/json": infer C } }
  ? C
  : void;
export type Result<K extends Operation> = operations[K] extends {
  responses: infer R;
}
  ? R extends { 200: infer S }
    ? Content<S>
    : R extends { 201: infer S }
      ? Content<S>
      : void
  : never;
export type RequestOptions<K extends Operation> = {
  body?: Body<K>;
  path?: Path<K>;
  query?: Query<K>;
  version?: number;
  idempotencyKey?: string;
  signal?: AbortSignal;
};
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: DTO["ApiError"],
  ) {
    super(payload.message);
  }
}
let csrfToken: string | null = null;
let csrfPending: Promise<string> | null = null;
export function resetCsrf() {
  csrfToken = null;
  csrfPending = null;
}
async function token() {
  if (csrfToken) return csrfToken;
  if (!csrfPending)
    csrfPending = fetch("/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("ارتباط با سرویس برقرار نشد. دوباره تلاش کنید.");
        const data = (await response.json()) as DTO["CsrfToken"];
        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfPending = null;
      });
  return csrfPending;
}
export async function api<K extends Operation>(
  operation: K,
  options: RequestOptions<K> = {},
  retryCsrf = true,
): Promise<Result<K>> {
  const route = routes[operation];
  let path: string = route.path;
  for (const [key, value] of Object.entries(options.path ?? {}))
    path = path.replace(`{${key}}`, encodeURIComponent(String(value)));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {}))
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  if (path.includes("{")) throw new Error("نشانی درخواست کامل نیست.");
  const write = !["GET", "HEAD"].includes(route.method);
  try {
    const response = await fetch(
      `/api${path}${query.size ? `?${query}` : ""}`,
      {
        method: route.method,
        credentials: "same-origin",
        cache: "no-store",
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000),
        headers: {
          ...(options.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...(write ? { "X-CSRF-Token": await token() } : {}),
          ...(options.version === undefined
            ? {}
            : { "If-Match": `"${options.version}"` }),
          ...(options.idempotencyKey
            ? { "Idempotency-Key": options.idempotencyKey }
            : {}),
        },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      },
    );
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({
        code: "UNAVAILABLE",
        message: "ارتباط با سرویس برقرار نشد. دوباره تلاش کنید.",
        requestId: "",
      }))) as DTO["ApiError"];
      if (
        response.status === 403 &&
        payload.code === "CSRF_REJECTED" &&
        retryCsrf
      ) {
        resetCsrf();
        return api(operation, options, false);
      }
      if (
        response.status === 401 &&
        operation !== "getSession" &&
        operation !== "login"
      )
        window.dispatchEvent(new Event("sarvin:session-expired"));
      throw new ApiError(response.status, payload);
    }
    return (
      response.status === 204 ? undefined : await response.json()
    ) as Result<K>;
  } catch (error) {
    if (
      error instanceof ApiError ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      throw error;
    throw new Error(
      "اتصال برقرار نشد. اطلاعات فرم حفظ شده است؛ دوباره تلاش کنید.",
    );
  }
}
// Foundation health display, retained until its page is replaced.
export async function apiGet<T>(
  path: `/${string}`,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("ارتباط با سرویس برقرار نشد.");
  return response.json() as Promise<T>;
}
