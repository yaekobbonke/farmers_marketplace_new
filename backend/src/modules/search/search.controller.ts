import { Request, Response } from "express";
import { SearchService } from "./search.service";

export class SearchController {

  static async search(req: Request, res: Response) {
    const { q } = req.query;

    const results = await SearchService.search(String(q));

    res.json({
      success: true,
      data: results
    });
  }

}
