"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class SearchProvider {
    static async semanticSearch(query) {
        const res = await axios_1.default.post("http://ai-search:7000/search", {
            query
        });
        return res.data.results;
    }
}
exports.SearchProvider = SearchProvider;
