import { Request, Response } from "express";
import { AssistantService } from "./assistant.service";

export class AssistantController {
  static async chat(req: Request, res: Response) {
    // 1. DEBUGGING: Check what Express actually sees
    console.log("--- 📥 Incoming AI Request ---");
    console.log("Headers:", req.headers["content-type"]);
    console.log("Raw Body:", req.body);

    // 2. FLEXIBLE DESTRUCTURING: Handle both 'query' and 'message'
    // This fixes issues where the frontend uses a different key name
   // In your AssistantController
const query = req.body?.query || req.body?.message || req.body?.text;

    if (!query) {
      console.error("❌ Error: No query/message found in request body.");
      return res.status(400).json({ 
        success: false, 
        message: "Query is required. Check if your JSON key is 'query' or 'message'.",
        received: req.body 
      });
    }

    try {
      const stream = await AssistantService.chat(query);

      // Set streaming headers
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 3. DATA HANDLING: Ensure we handle Buffer vs String correctly
      stream.on('data', (chunk: any) => {
        // In Node.js, chunks are often Buffers; res.write handles them fine
        res.write(chunk);
      });

      stream.on('end', () => {
        console.log("✅ Stream completed successfully.");
        res.end();
      });

      stream.on('error', (streamErr: any) => {
        console.error("❌ Stream Error:", streamErr.message);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Stream failed" });
        } else {
          res.end();
        }
      });

    } catch (error: any) {
      console.error("Assistant Controller Catch Error:", error.message);
      if (!res.headersSent) {
        return res.status(500).json({ 
          success: false, 
          message: error.message || "Connection to FastAPI failed" 
        });
      }
      res.end();
    }
  }
}