import { Request, Response } from "express";
import { AssistantService } from "./assistant.service";

export class AssistantController {

  // -------------------------
  // CHAT STREAM CONTROLLER
  // -------------------------
  static async chat(req: Request, res: Response) {
    console.log("--- 📥 Incoming AI Request ---");

    const body = req.body as any;
    const query = body?.query || body?.message || body?.text;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query is required (query | message | text)"
      });
    }

    const sanitizedQuery = query.trim().substring(0, 1000);

    if (!sanitizedQuery) {
      return res.status(400).json({
        success: false,
        message: "Query cannot be empty"
      });
    }

    try {
      const stream = await AssistantService.chat(sanitizedQuery);

      if (!stream) {
        return res.status(503).json({
          success: false,
          message: "AI service unavailable"
        });
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      stream.on("data", (chunk: Buffer | string) => {
        const data = Buffer.isBuffer(chunk)
          ? chunk.toString("utf-8")
          : chunk;

        res.write(data);
      });

      stream.on("end", () => {
        res.end();
      });

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err.message);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: "Stream failed"
          });
        }
        res.end();
      });

    } catch (error: any) {
      console.error("Chat controller error:", error.message);

      return res.status(500).json({
        success: false,
        message: error.message || "AI service error"
      });
    }
  }

  // -------------------------
  // PRICE FORECAST (UPDATED FOR FASTAPI AI)
  // -------------------------
  static async getPriceForecast(req: Request, res: Response) {
    try {
      const productId = Number(req.params.productId);

      if (!productId || isNaN(productId)) {
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
      console.error("Forecast error:", error.message);

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate price forecast"
      });
    }
  }

  // -------------------------
  // FARMER INSIGHTS
  // -------------------------
  static async getFarmerInsights(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const insights = await AssistantService.getFarmerInsights(userId);

      return res.status(200).json({
        success: true,
        data: insights
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // -------------------------
  // ADMIN INSIGHTS
  // -------------------------
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
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // -------------------------
  // CHAT HISTORY
  // -------------------------
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
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // -------------------------
  // SAVE CHAT MESSAGE
  // -------------------------
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
          message: "Query required"
        });
      }

      const saved = await AssistantService.saveChatMessage(
        userId,
        query,
        response
      );

      return res.status(200).json({
        success: true,
        data: saved
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default AssistantController;