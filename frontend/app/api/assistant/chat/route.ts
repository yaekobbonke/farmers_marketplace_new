import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    const response = await fetch(`${EXPRESS_URL}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { response: "AI service unavailable" },
      { status: 200 }
    );
  }
}