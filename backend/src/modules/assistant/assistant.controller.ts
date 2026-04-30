import { Request, Response } from "express";
import { AssistantService } from "./assistant.service";

export class AssistantController {
  static async chat(req: Request, res: Response) {
    // 1. DEBUGGING: Check what Express actually sees
    console.log("--- 📥 Incoming AI Request ---");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body:", req.body);

    // 2. FLEXIBLE DESTRUCTURING: Handle multiple possible field names
    const query = req.body?.query || req.body?.message || req.body?.text;

    if (!query) {
      console.error("❌ Error: No query/message found in request body.");
      return res.status(400).json({ 
        success: false, 
        message: "Query is required. Please provide 'query', 'message', or 'text' in your request body.",
        receivedBody: req.body 
      });
    }

    // Validate query type
    if (typeof query !== 'string') {
      console.error("❌ Error: Query must be a string");
      return res.status(400).json({
        success: false,
        message: "Query must be a text string"
      });
    }

    // Sanitize input to prevent injection attacks
    const sanitizedQuery = query.trim().substring(0, 1000); // Limit length
    
    // Check if query is empty after sanitization
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query cannot be empty"
      });
    }

    try {
      const stream = await AssistantService.chat(sanitizedQuery);

      // Set streaming headers
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Optional: Enable CORS for this endpoint if needed
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Flag to track if stream has ended
      let isStreamEnded = false;

      // 3. DATA HANDLING: Handle Buffer vs String correctly
      stream.on('data', (chunk: Buffer | string) => {
        if (isStreamEnded) return;
        
        // Convert Buffer to string if needed
        const data = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
        
        // Write to response
        try {
          res.write(data);
        } catch (writeError) {
          console.error("Error writing to response:", writeError);
          isStreamEnded = true;
          stream.destroy();
        }
      });

      stream.on('end', () => {
        if (isStreamEnded) return;
        isStreamEnded = true;
        console.log("✅ Stream completed successfully.");
        res.end();
      });

      stream.on('error', (streamErr: Error) => {
        if (isStreamEnded) return;
        isStreamEnded = true;
        
        console.error("❌ Stream Error:", streamErr.message);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: "AI service stream failed. Please try again." 
          });
        } else {
          try {
            res.end();
          } catch (err) {
            console.error("Error ending response:", err);
          }
        }
      });

      // Handle client disconnect
      req.on('close', () => {
        if (!isStreamEnded && !stream.destroyed) {
          console.log("⚠️ Client disconnected, destroying stream");
          isStreamEnded = true;
          stream.destroy();
        }
      });

      // Optional: Handle response finish
      res.on('finish', () => {
        if (!isStreamEnded && !stream.destroyed) {
          console.log("Response finished, cleaning up stream");
          stream.destroy();
        }
      });

    } catch (error: any) {
      console.error("Assistant Controller Catch Error:", error.message);
      
      // Don't send response if headers already sent
      if (!res.headersSent) {
        // Handle specific error types
        if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
          return res.status(503).json({ 
            success: false, 
            message: "AI service is currently unavailable. Please try again later." 
          });
        }
        
        if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
          return res.status(504).json({ 
            success: false, 
            message: "AI service is taking too long to respond. Please try again." 
          });
        }
        
        if (error.message?.includes('FASTAPI_URL')) {
          return res.status(500).json({
            success: false,
            message: "AI service is not configured correctly. Please contact support."
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          message: error.message || "Failed to connect to AI service" 
        });
      }
      
      // Headers already sent, try to end gracefully
      try {
        res.end();
      } catch (err) {
        console.error("Error ending response after error:", err);
      }
    }
  }
  static async healthCheck(req: Request, res: Response) {
  try {
    const FASTAPI_URL = process.env.FASTAPI_URL;
    
    if (!FASTAPI_URL) {
      return res.status(500).json({
        success: false,
        message: "FASTAPI_URL environment variable not configured"
      });
    }
    
    // Simple health check
    return res.status(200).json({
      success: true,
      message: "Assistant controller is operational",
      config: {
        fastapi_url: FASTAPI_URL ? "configured" : "missing"
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
}