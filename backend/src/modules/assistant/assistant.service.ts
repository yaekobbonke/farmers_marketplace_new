import { AssistantProvider } from "./assistant.provider";

export class AssistantService {
  /**
   * The Service acts as the business logic layer.
   * In this case, it calls the Provider to initiate the stream from FastAPI.
   */
  static async chat(query: string) {
    try {
      // We return the raw stream from the provider
      return await AssistantProvider.chatStream(query);
    } catch (error) {
      console.error("Error in AssistantService:", error);
      throw new Error("Could not retrieve advice from the AI Assistant.");
    }
  }
}