import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message = body.query || body.message;

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    console.log("🔗 Forwarding to:", `${FASTAPI_URL}/api/v1/chat/`);
    const response = await fetch(`${FASTAPI_URL}/api/v1/chat/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        user: "Farmer",
        session_id: body.session_id ?? crypto.randomUUID(),
        history: [],
      }),
    });

    const text = await response.text(); // safer for debugging
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      data = { response: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.detail || data?.message || text,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      response: data.response,
      session_id: data.session_id,
      timestamp: data.timestamp,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        response: "AI service unavailable",
        message:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}