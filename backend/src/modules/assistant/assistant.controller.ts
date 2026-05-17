import { Request, Response } from "express";
import { Readable } from "stream";
import { AssistantService } from "./assistant.service";

export class AssistantController {
  static async chat(req: Request, res: Response) {
    console.log("--- 📥 Incoming AI Request ---");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body:", req.body);

    const body = req.body as any;
    const query = body?.query || body?.message || body?.text;

    if (!query) {
      console.error("❌ Error: No query/message found in request body.");
      return res.status(400).json({ 
        success: false, 
        message: "Query is required. Please provide 'query', 'message', or 'text' in your request body.",
        receivedBody: req.body 
      });
    }

    if (typeof query !== 'string') {
      console.error("❌ Error: Query must be a string");
      return res.status(400).json({
        success: false,
        message: "Query must be a text string"
      });
    }

    const sanitizedQuery = query.trim().substring(0, 1000);
    
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Query cannot be empty"
      });
    }

    try {
      const stream = await AssistantService.chat(sanitizedQuery);

      if (!stream) {
        console.error("❌ Error: Received null stream from AssistantService");
        return res.status(503).json({ 
          success: false, 
          message: "AI service is currently unavailable. Please try again later." 
        });
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Access-Control-Allow-Origin', '*');

      let isStreamEnded = false;

      stream.on('data', (chunk: Buffer | string) => {
        if (isStreamEnded) return;
        const data = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
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

      req.on('close', () => {
        if (!isStreamEnded && stream && !stream.destroyed) {
          console.log("⚠️ Client disconnected, destroying stream");
          isStreamEnded = true;
          stream.destroy();
        }
      });

      res.on('finish', () => {
        if (!isStreamEnded && stream && !stream.destroyed) {
          console.log("Response finished, cleaning up stream");
          stream.destroy();
        }
      });

    } catch (error: any) {
      console.error("Assistant Controller Catch Error:", error.message);
      
      if (!res.headersSent) {
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
        
        return res.status(500).json({ 
          success: false, 
          message: error.message || "Failed to connect to AI service" 
        });
      }
      
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

  static async getFarmerInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized. Please log in." 
        });
      }
      
      console.log(`🔍 Fetching insights for farmer ID: ${userId}`);
      const insights = await AssistantService.getFarmerInsights(userId);
      
      return res.status(200).json({
        success: true,
        data: insights
      });
      
    } catch (error: any) {
      console.error("Error fetching farmer insights:", error.message);
      return res.status(200).json({
        success: true,
        data: {
          hasData: false,
          message: "Welcome to your farm dashboard!",
          recommendation: "Start adding products to get AI-powered insights and recommendations.",
          actionLink: "/farmer/products/add",
          actionText: "Add Your First Product",
          topProduct: null,
          pendingCount: 0,
          lowStockCount: 0,
          insights: [
            {
              type: "info",
              message: "Add your first product to start selling",
              action: "Get Started",
              link: "/farmer/products/add"
            }
          ]
        }
      });
    }
  }

  static async getAdminInsights(req: Request, res: Response) {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const insights = await AssistantService.getAdminInsights();
      
      return res.status(200).json({
        success: true,
        data: insights
      });
      
    } catch (error: any) {
      console.error("Error fetching admin insights:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch admin insights"
      });
    }
  }

  static async getChatHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized" 
        });
      }
      
      const history = await AssistantService.getChatHistory(userId);
      
      return res.status(200).json({
        success: true,
        data: history
      });
      
    } catch (error: any) {
      console.error("❌ Error fetching chat history:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch chat history"
      });
    }
  }

  static async saveChatMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { query, response } = req.body;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized" 
        });
      }
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required"
        });
      }
      
      const saved = await AssistantService.saveChatMessage(userId, query, response);
      
      return res.status(200).json({
        success: true,
        data: saved,
        message: "Chat message saved successfully"
      });
      
    } catch (error: any) {
      console.error("❌ Error saving chat message:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to save chat message"
      });
    }
  }

  static async getPriceForecast(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID"
        });
      }
      
      const forecast = await AssistantService.getPriceForecast(productId);
      
      return res.status(200).json({
        success: true,
        data: forecast
      });
      
    } catch (error: any) {
      console.error("❌ Error fetching price forecast:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch price forecast"
      });
    }
  }
}

export default AssistantController;