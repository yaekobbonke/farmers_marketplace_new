import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const response = await fetch(`${EXPRESS_URL}/assistant/forecast/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}