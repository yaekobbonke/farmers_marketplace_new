"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const search_provider_1 = require("./search.provider");
class SearchService {
    static async search(query) {
        return search_provider_1.SearchProvider.semanticSearch(query);
    }
}
exports.SearchService = SearchService;
