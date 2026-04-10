"use client";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { streamChat } from "@/lib/ai-stream";

export default function ChatAssistant({ messages, setMessages }: any) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userQuery = input;
    setInput("");

    // 1. Add user message
    setMessages((prev: any) => [...prev, { role: "user", content: userQuery }]);

    // 2. Add empty assistant message for streaming
    setMessages((prev: any) => [...prev, { role: "assistant", content: "" }]);
    setIsTyping(true);

    try {
      await streamChat(userQuery, (chunk: string) => {
        setMessages((prev: any) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;

          // ✅ Safe check: ensure last message is assistant
          if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: newMessages[lastIndex].content + chunk,
            };
          }
          return newMessages;
        });
      });
    } catch (err) {
      console.error("Chat error:", err);

      // Update last assistant message with error message safely
      setMessages((prev: any) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: "⚠️ Failed to connect to AI.",
          };
        }
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: any, i: number) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                m.role === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Agri-AI Expert..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={sendMessage}
            disabled={isTyping}
            className="absolute right-2 p-2 text-green-600 hover:bg-green-50 rounded-lg"
          >
            {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}