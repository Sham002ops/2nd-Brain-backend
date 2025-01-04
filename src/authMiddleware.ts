import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload }  from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header =  req.header("Authorization")?.replace("Bearer ", "");
  
    jwt.verify(header as string, JWT_PASSWORD, (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Token Expired"
                });
            }
            return res.status(403).json({
                message: "Invalid token"
            });
        }

        if (typeof decoded === "string") {
            return res.status(403).json({
                message: "Invalid token"
            });
        }
        // @ts-ignore
        req.userId = (decoded as JwtPayload).id;
        next();
    });
    
}