"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("./auth.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.AuthController.register);
router.post("/login", auth_controller_1.AuthController.login);
exports.default = router;
