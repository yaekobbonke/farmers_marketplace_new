import express, { Express } from "express";
import cors from "cors";
import routes from "./routes"; 
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app: Express = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Use 'any' type for quick fix
app.use((req: any, res: any, next: any) => {
    if (req.method === "POST") {
        console.log(`📦 [${req.method}] ${req.path} - Body:`, req.body);
    }
    next();
});

app.use("/api", routes);

// ✅ Use 'any' type for route handler
app.get("/", (req: any, res: any) => {
    res.send("Farmers Marketplace API is running...");
});

app.use(errorHandler);

export default app;