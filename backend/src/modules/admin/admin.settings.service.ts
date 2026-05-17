import prisma from "../../config/prisma";

interface SettingsData {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRate: number;
  commissionRate: number;
  maxProductImages: number;
  autoApproveProducts: boolean;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  maintenanceMode: boolean;
  theme: string;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SettingInput {
  key: string;
  value: string;
  type: string;
  description?: string;
}

export class AdminSettingsService {
  
  static async getSettings(): Promise<SettingsData> {
    const settings = await prisma.systemSetting.findMany();
    
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
  
  static async updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
    const operations: Promise<any>[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      let stringValue: string;
      let type: string;
      
      if (typeof value === 'boolean') {
        stringValue = String(value);
        type = 'boolean';
      } else if (typeof value === 'number') {
        stringValue = String(value);
        type = 'number';
      } else if (typeof value === 'string') {
        stringValue = value;
        type = 'string';
      } else {
        continue; // Skip invalid values
      }
      
      operations.push(
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: stringValue, type },
          create: { key, value: stringValue, type, description: null }
        })
      );
    }
    
    await Promise.all(operations);
    
    // Clear cache if needed
    if (data.maintenanceMode !== undefined) {
      // You could emit an event here
      console.log("Maintenance mode changed:", data.maintenanceMode);
    }
    
    return this.getSettings();
  }
  
  static async getSetting(key: string, defaultValue: string = ''): Promise<string> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.value || defaultValue;
  }
  
  static async updateSetting(key: string, value: string): Promise<void> {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, type: 'string', description: null }
    });
  }
  
  private static getValue(map: Map<string, SystemSetting>, key: string, defaultValue: string): string {
    const setting = map.get(key);
    return setting?.value || defaultValue;
  }
  
  static async clearCache(): Promise<void> {
    // Clear any cached settings
    console.log("Cache cleared");
  }
  
  static async seedDefaultSettings(): Promise<void> {
    const defaultSettings: SettingInput[] = [
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
      try {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            type: setting.type,
            description: setting.description || null
          },
          create: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            description: setting.description || null
          }
        });
      } catch (error) {
        console.error(`Failed to seed setting ${setting.key}:`, error);
        // Continue with other settings
      }
    }
    
    console.log("Default settings seeded successfully");
  }
  
  // Helper method to get a typed setting value
  static async getTypedSetting<T = string>(key: string, defaultValue: T): Promise<T> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return defaultValue;
    }
    
    switch (setting.type) {
      case 'boolean':
        return (setting.value === 'true') as T;
      case 'number':
        return parseFloat(setting.value) as T;
      default:
        return setting.value as T;
    }
  }
}

export default AdminSettingsService;