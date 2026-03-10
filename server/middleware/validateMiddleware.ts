import { Request, Response, NextFunction } from 'express';
import { validationResult, body, ValidationChain } from 'express-validator';

// Middleware to handle validation results
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Legacy field presence check (if still needed anywhere else)
export const validateFields = (requiredFields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const missingFields: string[] = [];

        for (const field of requiredFields) {
            if (!req.body[field] || req.body[field].toString().trim() === "") {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        next();
    };
};
