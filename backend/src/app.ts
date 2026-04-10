import express, { Express } from "express";
import cors from "cors";
import routes from "./routes"; 
import dotenv from "dotenv";
import { initScraperCron } from './jobs/scraper.job';
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app: Express = express();

// 1. MIDDLEWARE FIRST
app.use(cors()); 
app.use(express.json()); // This reads the stream and populates req.body
app.use(express.urlencoded({ extended: true }));

// 2. LOGGING MIDDLEWARE (Safe version)
app.use((req, res, next) => {
    // We log req.body instead of reading the raw stream manually
    if (req.method === "POST") {
        console.log(`📦 [${req.method}] ${req.path} - Body:`, req.body);
    }
    next();
});

// 3. ROUTES
app.use("/api", routes);

// 4. HEALTH CHECK
app.get("/", (req, res) => {
    res.send("Farmers Marketplace API is running...");
});

// 5. CRON & ERROR HANDLING
initScraperCron();
app.use(errorHandler); // Always last

export default app;