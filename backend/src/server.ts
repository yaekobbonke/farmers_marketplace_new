import app from "./app";
import { AdminSettingsService } from "./modules/admin/admin.settings.service";

const port = process.env.PORT || 5000;

async function startServer() {
  try {
    // Wait for seeding to complete
    await AdminSettingsService.seedDefaultSettings();
    console.log("Default settings seeded");
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API available at http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();