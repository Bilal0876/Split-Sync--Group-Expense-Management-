import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log error for development
    if (process.env.NODE_ENV !== 'production') {
        console.error('SERVER ERROR:', err);
    }

    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
