"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Send, X, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

// Session timeout configuration
const SESSION_TIMEOUT_MINUTES = 30;
const WARNING_MINUTES = 2;

// Message interface
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_MINUTES * 60);
  
  // Refs for timeouts
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts
  const clearTimeouts = () => {
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
  };

  // Logout function
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    router.push("/login");
  };

  // Reset the session timer
  const resetTimer = () => {
    clearTimeouts();
    setShowWarning(false);
    
    const warningTimeoutMs = (SESSION_TIMEOUT_MINUTES - WARNING_MINUTES) * 60 * 1000;
    if (warningTimeoutMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(WARNING_MINUTES * 60);
        
        warningIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningTimeoutMs);
    }
    
    logoutTimeoutRef.current = setTimeout(handleLogout, SESSION_TIMEOUT_MINUTES * 60 * 1000);
  };

  // Stay logged in
  const stayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    const handleActivity = () => resetTimer();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeouts();
    };
  }, []);

  // Authentication check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() !== "FARMER") {
        if (user.role?.toUpperCase() === "ADMIN") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/login");
        }
        return;
      }
      setIsAuthorized(true);
    } catch (error) {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <>
      <Navbar />
      <AIAssistantButton />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
      
      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Session Expiring Soon</h3>
                <p className="text-slate-500">Due to inactivity, you'll be logged out in {Math.ceil(timeLeft / 60)} minute{Math.ceil(timeLeft / 60) !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              Click "Stay Logged In" to continue your session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={stayLoggedIn}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// AI Assistant Floating Button Component (Connected to Backend)
function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI farming assistant. I can help you with:\n\n• Crop price predictions\n• Best planting seasons\n• Pest control advice\n• Market trends",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call the Next.js API route
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userMessage.content })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || data.message || "I received your message!",
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "Sorry, I encountered an error. Please try again.",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting to the AI service. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"></div>
          {/* Button */}
          <div className="relative w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
            <MessageSquare className="text-white" size={24} />
          </div>
        </div>
      </button>

      {/* AI Assistant Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 flex flex-col max-h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} />
                  <h3 className="font-bold">AI Farming Assistant</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-green-100 mt-1">Powered by AgriSmart AI</p>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      message.role === "user" ? "text-green-200" : "text-gray-400"
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                AI responses are for informational purposes only
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}