import { Request, Response, NextFunction } from 'express';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Middleware that validates :id route params are valid UUIDs.
 * Returns 400 instead of letting invalid UUIDs hit PostgreSQL and cause 500s.
 */
export function validateUuidParam(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (value && !UUID_REGEX.test(value)) {
      res.status(400).json({ error: `Invalid ${paramName} format` });
      return;
    }
    next();
  };
}
