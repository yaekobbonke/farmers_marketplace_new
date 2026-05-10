"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { streamChat } from "@/lib/ai-stream";
import { MessageSquare } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatAssistantProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatAssistant({ messages, setMessages }: ChatAssistantProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isTyping) return;

    const userQuery = trimmedInput;
    setInput("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsTyping(true);

    try {
      let accumulatedContent = "";
      
      await streamChat(userQuery, (chunk: string) => {
        accumulatedContent += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          
          if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: accumulatedContent,
            };
          }
          return newMessages;
        });
      });
    } catch (err) {
      console.error("Chat error:", err);
      
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: "Sorry, I'm having trouble connecting. Please try again.",
          };
        }
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <MessageSquare size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Ask me anything about farming!</p>
            <p className="text-xs mt-1">Crop prices, planting seasons, market trends...</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  message.role === "user"
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content || (message.role === "assistant" && isTyping && index === messages.length - 1 ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    message.content
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Agri-AI Expert..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            disabled={isTyping}
          />
          <button
            onClick={sendMessage}
            disabled={isTyping || !input.trim()}
            className="absolute right-2 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2">
          AI responses are for informational purposes only
        </p>
      </div>
    </div>
  );
}