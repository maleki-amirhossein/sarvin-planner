import { z } from "zod";
import { parse, fail } from "../http/errors";
import { digest } from "./mutations";
export const pageFields = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(2048).optional(),
};
export function pagination(
  query: { limit: number; cursor?: string },
  ownerId: string,
  filters: unknown,
) {
  const fingerprint = digest({ ownerId, filters });
  let cursor: { at: string; id: string; filter: string } | undefined;
  if (query.cursor) {
    try {
      cursor = parse(
        z
          .object({ at: z.iso.datetime(), id: z.uuid(), filter: z.string() })
          .strict(),
        JSON.parse(Buffer.from(query.cursor, "base64url").toString()),
      );
    } catch {
      fail(400, "VALIDATION_ERROR", "نشانی صفحه معتبر نیست.");
    }
    if (cursor.filter !== fingerprint)
      fail(
        400,
        "VALIDATION_ERROR",
        "فیلتر تغییر کرده است. فهرست را دوباره بارگیری کنید.",
      );
  }
  return {
    where: cursor
      ? {
          OR: [
            { createdAt: { gt: new Date(cursor.at) } },
            { createdAt: new Date(cursor.at), id: { gt: cursor.id } },
          ],
        }
      : {},
    take: query.limit + 1,
    finish<T extends { id: string; createdAt: Date }, U>(
      rows: T[],
      map: (value: T) => U,
    ) {
      const visible = rows.slice(0, query.limit),
        last = visible.at(-1);
      return {
        items: visible.map(map),
        nextCursor:
          rows.length > query.limit && last
            ? Buffer.from(
                JSON.stringify({
                  at: last.createdAt.toISOString(),
                  id: last.id,
                  filter: fingerprint,
                }),
              ).toString("base64url")
            : null,
      };
    },
  };
}
