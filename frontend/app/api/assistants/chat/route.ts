import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.query || body.message;
    const userRole = body.role || "BUYER";
    const userName = body.userName || "";
    const sessionId = body.session_id || crypto.randomUUID();
    const chatHistory = body.history || [];

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    // Prepare user type for FastAPI
    const userType = userRole === "FARMER" ? "Farmer" : "Buyer";
    
    console.log(`🤖 AI Chat Request:`);
    console.log(`   User: ${userType}${userName ? ` (${userName})` : ''}`);
    console.log(`   Message: ${message}`);
    console.log(`   Session: ${sessionId}`);

    // Call your FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/api/v1/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: message,
        user: userType,
        user_name: userName,
        user_role: userRole,
        session_id: sessionId,
        history: chatHistory,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ FastAPI Error (${response.status}):`, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: "AI service error",
          response: "Sorry, I'm having trouble processing your request. Please try again."
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`✅ AI Response sent successfully`);

    return NextResponse.json({
      success: true,
      response: data.response || data.message || "I've received your message!",
      session_id: data.session_id || sessionId,
      timestamp: data.timestamp || new Date().toISOString(),
      role: userRole,
    });
    
  } catch (error) {
    console.error("🔥 Chat API Error:", error);
    return NextResponse.json(
      {
        success: false,
        response: "AI service is currently unavailable. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch(`${FASTAPI_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (response.ok) {
      return NextResponse.json({ 
        status: "healthy", 
        ai_service: "connected",
        backend: FASTAPI_URL
      });
    } else {
      return NextResponse.json(
        { status: "unhealthy", ai_service: "disconnected" },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: "Cannot connect to AI service" },
      { status: 503 }
    );
  }
}