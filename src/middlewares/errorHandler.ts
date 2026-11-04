import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/HttpError.ts";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  let statusCode = 500;
  let message = "Terjadi kesalahan pada server";

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Body request bukan JSON yang valid";
  } else if (err instanceof Error) {
    console.error("[error]", err);
  }

  res.status(statusCode).json({
    status: false,
    message,
  });
};
