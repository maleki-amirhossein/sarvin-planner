import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";
export function fail(status: number, code: string, message: string, details?: unknown): never {
  throw new HttpException({ code, message, ...(details === undefined ? {} : { details }) }, status);
}
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpException({ code: "VALIDATION_ERROR", message: "اطلاعات واردشده را بررسی کنید.", fieldErrors: Object.fromEntries(result.error.issues.map(issue => [issue.path.join("."), ["مقدار معتبر وارد کنید."]])) }, 400);
  return result.data;
}
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : error instanceof RangeError ? 400 : 503;
    const payload = error instanceof HttpException ? error.getResponse() : error instanceof RangeError ? { code: "VALIDATION_ERROR", message: "تاریخ، ساعت یا بازه معتبر وارد کنید." } : null;
    const safe = typeof payload === "object" && payload && "code" in payload ? payload : { code: status === 404 ? "NOT_FOUND" : "UNAVAILABLE", message: status === 404 ? "موردی پیدا نشد." : "ارتباط با سرویس برقرار نشد. دوباره تلاش کنید." };
    response.status(status).json({ ...safe, requestId: response.getHeader("X-Request-Id") });
  }
}
