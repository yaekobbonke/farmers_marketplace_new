"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantService = void 0;
const assistant_provider_1 = require("./assistant.provider");
class AssistantService {
    /**
     * The Service acts as the business logic layer.
     * In this case, it calls the Provider to initiate the stream from FastAPI.
     */
    static async chat(query) {
        // Validate input
        if (!query || typeof query !== 'string') {
            throw new Error('Invalid query: Query must be a non-empty string');
        }
        const trimmedQuery = query.trim();
        if (trimmedQuery.length === 0) {
            throw new Error('Query cannot be empty');
        }
        if (trimmedQuery.length > 5000) {
            throw new Error('Query is too long. Maximum 5000 characters allowed.');
        }
        try {
            // We return the raw stream from the provider
            const stream = await assistant_provider_1.AssistantProvider.chatStream(trimmedQuery);
            return stream;
        }
        catch (error) {
            console.error("Error in AssistantService:", error);
            throw new Error("Could not retrieve advice from the AI Assistant.");
        }
    }
}
exports.AssistantService = AssistantService;
