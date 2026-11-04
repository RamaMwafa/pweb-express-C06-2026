import type { Response } from "express";

export interface PaginationMetadata {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface SuccessOptions<T> {
  message: string;
  data?: T;
  metadata?: PaginationMetadata;
  statusCode?: number;
}

export function sendSuccess<T>(
  res: Response,
  {
    message,
    data,
    metadata,
    statusCode = 200,
  }: SuccessOptions<T>,
): Response {
  const body: Record<string, unknown> = {
    status: true,
    message,
  };

  if (data !== undefined) {
    body.data = data;
  }

  if (metadata !== undefined) {
    body.metadata = metadata;
  }

  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
): Response {
  return res.status(statusCode).json({
    status: false,
    message,
  });
}
