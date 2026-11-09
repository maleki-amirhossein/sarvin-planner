import Ajv from "ajv";
import { HttpException } from "@nestjs/common";
import addFormats from "ajv-formats";
import { z } from "zod";
import schemas from "./contract-schemas.json";
import type { components } from "../../../../docs/contracts/api";
import { fail } from "./errors";
export type DTO = components["schemas"];
const ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: false });
addFormats(ajv);
ajv.addSchema(schemas);
export function input<K extends keyof DTO>(name: K, body: unknown): DTO[K] {
  const validator = ajv.getSchema(`sarvin#/components/schemas/${name}`)!;
  if (!validator(body)) {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of validator.errors ?? []) {
      const field =
        error.instancePath.split("/").filter(Boolean).join(".") ||
        String(error.params.missingProperty ?? "form");
      const message =
        error.keyword === "required"
          ? "این مقدار الزامی است."
          : error.keyword === "minimum" || error.keyword === "maximum"
            ? "مقدار خارج از محدوده مجاز است."
            : error.keyword === "format" || error.keyword === "pattern"
              ? "قالب مقدار معتبر نیست."
              : "مقدار معتبر وارد کنید.";
      fieldErrors[field] = [
        ...new Set([...(fieldErrors[field] ?? []), message]),
      ];
    }
    throw new HttpException(
      {
        code: "VALIDATION_ERROR",
        message: "اطلاعات واردشده را بررسی کنید.",
        fieldErrors,
      },
      400,
    );
  }
  return body as DTO[K];
}
export function uuid(value: string) {
  if (!z.uuid().safeParse(value).success)
    fail(400, "VALIDATION_ERROR", "شناسه معتبر نیست.");
  return value;
}
export function nonempty(value: string) {
  if (!value.trim()) fail(400, "VALIDATION_ERROR", "عنوان را وارد کنید.");
  return value.trim();
}
