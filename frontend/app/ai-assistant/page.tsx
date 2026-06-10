"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { streamAssistantChat } from "@/lib/assistantService";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Placeholder for assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await streamAssistantChat(input, (chunk) => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const updatedMessages = [...prev.slice(0, -1)];
          return [
            ...updatedMessages,
            { ...lastMessage, content: lastMessage.content + chunk },
          ];
        });
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error: Could not reach the server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-green-50/30 flex items-center gap-3">
        <div className="bg-green-600 p-2 rounded-lg text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Agri-Insight AI</h2>
          <p className="text-xs text-green-600 font-medium">Online • Price Intelligence & Farming Advice</p>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
            <Bot size={48} className="text-gray-200" />
            <p className="text-gray-400 text-sm">Ask me about market prices, crop health, or planting tips!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`p-2 rounded-xl h-fit ${msg.role === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-green-50 text-green-900 rounded-tr-none" 
                : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
            }`}>
              {msg.content}
              {isLoading && idx === messages.length - 1 && !msg.content && (
                <Loader2 size={16} className="animate-spin text-green-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
          <input
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            placeholder="Type your agricultural question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}