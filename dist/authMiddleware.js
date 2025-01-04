"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const userMiddleware = (req, res, next) => {
    var _a;
    const header = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    jsonwebtoken_1.default.verify(header, config_1.JWT_PASSWORD, (err, decoded) => {
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
        req.userId = decoded.id;
        next();
    });
};
exports.userMiddleware = userMiddleware;
