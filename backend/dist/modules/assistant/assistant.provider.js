"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantProvider = void 0;
const stream_1 = require("stream");
class AssistantProvider {
    static async chatStream(query) {
        // Get FastAPI URL from environment variable with fallback
        const FASTAPI_URL = process.env.FASTAPI_URL || process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
        const endpoint = `${FASTAPI_URL}/api/v1/chat/`;
        // Validate input
        if (!query || typeof query !== 'string') {
            throw new Error('Invalid query: Query must be a non-empty string');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                },
                body: JSON.stringify({ message: query }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const text = await response.text();
                console.error(`FastAPI error ${response.status}:`, text);
                // Provide user-friendly error messages based on status code
                if (response.status === 404) {
                    throw new Error("AI service endpoint not found. Please check the URL.");
                }
                if (response.status === 429) {
                    throw new Error("AI service is busy. Please try again in a moment.");
                }
                throw new Error(`AI service error: ${response.status} - ${text.substring(0, 200)}`);
            }
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader)
                throw new Error("No stream available from AI service");
            const stream = new stream_1.Readable({
                read() { },
                // Clean up on destroy
                destroy(err, callback) {
                    reader.cancel().catch(() => { });
                    callback(err);
                }
            });
            // Process the stream asynchronously
            (async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        // Decode the chunk and push to stream
                        const chunk = decoder.decode(value, { stream: true });
                        stream.push(chunk);
                    }
                    stream.push(null);
                }
                catch (error) {
                    console.error("Stream reading error:", error);
                    stream.destroy(error);
                }
            })();
            return stream;
        }
        catch (error) {
            clearTimeout(timeoutId);
            // Handle specific error types
            if (error.name === 'AbortError') {
                throw new Error("AI service request timed out after 60 seconds");
            }
            if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
                throw new Error("Cannot connect to AI service. Please check if it's running.");
            }
            console.error("Fetch error:", error);
            throw error;
        }
    }
}
exports.AssistantProvider = AssistantProvider;
