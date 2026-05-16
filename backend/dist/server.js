"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const admin_settings_service_1 = require("./modules/admin/admin.settings.service");
const port = process.env.PORT || 5000;
async function startServer() {
    try {
        // Wait for seeding to complete
        await admin_settings_service_1.AdminSettingsService.seedDefaultSettings();
        console.log("Default settings seeded");
        app_1.default.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`API available at http://localhost:${port}/api`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
