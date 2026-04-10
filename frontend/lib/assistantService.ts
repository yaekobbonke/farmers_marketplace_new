// lib/assistantService.ts
export const streamAssistantChat = async (query: string, onChunk: (text: string) => void) => {
  const response = await fetch("http://localhost:5000/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }), // Matches the 'query' key in your Express controller
  });

  if (!response.ok) throw new Error("Failed to connect to assistant");

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No readable stream available");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    onChunk(chunkText);
  }
};