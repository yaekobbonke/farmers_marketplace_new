import express, { Express } from "express";
import cors from "cors";
import routes from "./routes"; 
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app: Express = express();


app.use(cors()); 
app.use(express.json()); // This reads the stream and populates req.body
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    if (req.method === "POST") {
        console.log(`📦 [${req.method}] ${req.path} - Body:`, req.body);
    }
    next();
});


app.use("/api", routes);


app.get("/", (req, res) => {
    res.send("Farmers Marketplace API is running...");
});


app.use(errorHandler); 

export default app;