"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_schema_1 = require("./auth.schema");
class AuthController {
    static async register(req, res, next) {
        try {
            const data = auth_schema_1.registerSchema.parse(req.body);
            const { userId } = await auth_service_1.AuthService.register(data);
            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: { userId },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const data = auth_schema_1.loginSchema.parse(req.body);
            // DESTUCTURE BOTH: token and user (which includes the role)
            const { token, user } = await auth_service_1.AuthService.login(data);
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    token,
                    user, // Now frontend knows: user.role === 'FARMER'
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
