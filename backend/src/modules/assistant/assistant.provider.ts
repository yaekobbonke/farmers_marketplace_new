import { Readable } from "stream";

export class AssistantProvider {
  static async chatStream(query: string) {
    const response = await fetch(
      "http://127.0.0.1:8000/api/v1/chat/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No stream");

    const stream = new Readable({
      read() {},
    });

    (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        stream.push(decoder.decode(value));
      }
      stream.push(null);
    })();

    return stream;
  }
}