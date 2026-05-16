"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSettingsService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class AdminSettingsService {
    static async getSettings() {
        const settings = await prisma_1.default.systemSetting.findMany();
        const settingsMap = new Map(settings.map(s => [s.key, s]));
        // Default values
        return {
            siteName: this.getValue(settingsMap, 'siteName', 'AgriSmart'),
            siteDescription: this.getValue(settingsMap, 'siteDescription', 'AI-Powered Agricultural Marketplace'),
            contactEmail: this.getValue(settingsMap, 'contactEmail', 'support@agrismart.com'),
            contactPhone: this.getValue(settingsMap, 'contactPhone', '+251-911-123456'),
            address: this.getValue(settingsMap, 'address', 'Addis Ababa, Ethiopia'),
            currency: this.getValue(settingsMap, 'currency', 'ETB'),
            taxRate: parseFloat(this.getValue(settingsMap, 'taxRate', '0')),
            commissionRate: parseFloat(this.getValue(settingsMap, 'commissionRate', '5')),
            maxProductImages: parseInt(this.getValue(settingsMap, 'maxProductImages', '5')),
            autoApproveProducts: this.getValue(settingsMap, 'autoApproveProducts', 'false') === 'true',
            enableNotifications: this.getValue(settingsMap, 'enableNotifications', 'true') === 'true',
            enableEmailAlerts: this.getValue(settingsMap, 'enableEmailAlerts', 'true') === 'true',
            maintenanceMode: this.getValue(settingsMap, 'maintenanceMode', 'false') === 'true',
            theme: this.getValue(settingsMap, 'theme', 'light'),
        };
    }
    static async updateSettings(data) {
        const operations = [];
        for (const [key, value] of Object.entries(data)) {
            let stringValue;
            let type;
            if (typeof value === 'boolean') {
                stringValue = String(value);
                type = 'boolean';
            }
            else if (typeof value === 'number') {
                stringValue = String(value);
                type = 'number';
            }
            else {
                stringValue = String(value);
                type = 'string';
            }
            operations.push(prisma_1.default.systemSetting.upsert({
                where: { key },
                update: { value: stringValue, type },
                create: { key, value: stringValue, type }
            }));
        }
        await Promise.all(operations);
        // Clear cache if needed
        if (data.maintenanceMode !== undefined) {
            // You could emit an event here
        }
        return this.getSettings();
    }
    static async getSetting(key, defaultValue = '') {
        const setting = await prisma_1.default.systemSetting.findUnique({
            where: { key }
        });
        return setting?.value || defaultValue;
    }
    static async updateSetting(key, value) {
        await prisma_1.default.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    }
    static getValue(map, key, defaultValue) {
        const setting = map.get(key);
        return setting?.value || defaultValue;
    }
    static async clearCache() {
        // Clear any cached settings
        console.log("Cache cleared");
    }
    static async seedDefaultSettings() {
        const defaultSettings = [
            { key: 'siteName', value: 'AgriSmart', type: 'string', description: 'Site name' },
            { key: 'siteDescription', value: 'AI-Powered Agricultural Marketplace', type: 'string', description: 'Site description' },
            { key: 'contactEmail', value: 'support@agrismart.com', type: 'string', description: 'Contact email' },
            { key: 'contactPhone', value: '+251-911-123456', type: 'string', description: 'Contact phone' },
            { key: 'address', value: 'Addis Ababa, Ethiopia', type: 'string', description: 'Business address' },
            { key: 'currency', value: 'ETB', type: 'string', description: 'Default currency' },
            { key: 'taxRate', value: '0', type: 'number', description: 'Tax rate percentage' },
            { key: 'commissionRate', value: '5', type: 'number', description: 'Commission rate percentage' },
            { key: 'maxProductImages', value: '5', type: 'number', description: 'Maximum product images' },
            { key: 'autoApproveProducts', value: 'false', type: 'boolean', description: 'Auto approve products' },
            { key: 'enableNotifications', value: 'true', type: 'boolean', description: 'Enable notifications' },
            { key: 'enableEmailAlerts', value: 'true', type: 'boolean', description: 'Enable email alerts' },
            { key: 'maintenanceMode', value: 'false', type: 'boolean', description: 'Maintenance mode' },
            { key: 'theme', value: 'light', type: 'string', description: 'Theme preference' },
        ];
        for (const setting of defaultSettings) {
            await prisma_1.default.systemSetting.upsert({
                where: { key: setting.key },
                update: {},
                create: setting
            });
        }
    }
}
exports.AdminSettingsService = AdminSettingsService;
