import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.ts';


export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    
    console.log('Incoming request cookies:', req.cookies);
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

        // Robustness check: Ensure user still exists in DB (e.g. after a reset)
        const userExists = await prisma.users.findUnique({
            where: { id: decoded.id },
            select: { id: true }
        });

        if (!userExists) {
            return res.status(401).json({ message: "User no longer exists. Please sign up again." });
        }

        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
