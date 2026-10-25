import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Async-роути без try/catch у кожному хендлері
export const asyncRoute = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
