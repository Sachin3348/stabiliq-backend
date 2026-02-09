import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/response';

/**
 * Runs express-validator chains and returns 400 with { detail } if invalid.
 * Use after body(...) etc. in routes.
 * @param validationChains - express-validator chains
 * @param customDetail - optional message to use instead of first error (preserves API contract)
 */
export function validate(
  validationChains: ValidationChain[],
  customDetail?: string
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validationChains.map((chain) => chain.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const detail =
        customDetail ?? (errors.array()[0]?.msg as string | undefined) ?? 'Validation failed';
      sendError(res, 400, typeof detail === 'string' ? detail : 'Validation failed');
      return;
    }
    next();
  };
}

/** Return 400 with a single detail message (for custom validation in route) */
export function validationError(res: Response, detail: string): Response {
  return sendError(res, 400, detail);
}
