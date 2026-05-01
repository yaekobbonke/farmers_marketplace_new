"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const search_service_1 = require("./search.service");
class SearchController {
    static async search(req, res) {
        const { q } = req.query;
        const results = await search_service_1.SearchService.search(String(q));
        res.json({
            success: true,
            data: results
        });
    }
}
exports.SearchController = SearchController;
