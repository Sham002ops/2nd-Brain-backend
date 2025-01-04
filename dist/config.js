"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONGO_URL = exports.JWT_PASSWORD = void 0;
exports.JWT_PASSWORD = process.env.JWT_USER_PASSWORD || "defaultPassword";
exports.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/defaultdb';
