import { exec } from 'child_process';
import cron from 'node-cron';
import path from 'path';

export const initScraperCron = () => {
  // Schedule: Runs every day at 06:00 AM
  // Format: (minute hour day-of-month month day-of-week)
  cron.schedule('0 6 * * *', () => {
    console.log('--- Starting Daily Ethiopian Market Scrape ---');

    // Path to your python script in the ai-services folder
    const scriptPath = path.join(__dirname, '../../../ai-services/core/scraper.py');
    
    // Execute the python script
    exec(`python3 ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Scraper Execution Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Scraper Stderr: ${stderr}`);
        return;
      }
      console.log(`Scraper Output: ${stdout}`);
      console.log('--- Daily Scrape Completed ---');
    });
  });

  console.log('✅ Cron Job Initialized: Market Scraper scheduled for 06:00 daily.');
};