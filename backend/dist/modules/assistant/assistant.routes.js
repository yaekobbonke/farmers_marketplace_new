"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assistant_controller_1 = require("./assistant.controller");
const router = (0, express_1.Router)();
router.post("/chat", assistant_controller_1.AssistantController.chat);
exports.default = router;
