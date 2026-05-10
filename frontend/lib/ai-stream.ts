// lib/ai-stream.ts
export const streamChat = async (
  query: string,
  onChunk: (text: string) => void
) => {
  // ✅ Call Next.js API route instead of Express directly
  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }), 
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Stream failed:", text);
    throw new Error(`Connection failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body available for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = value ? decoder.decode(value, { stream: true }) : "";
    onChunk(chunk);
  }
};