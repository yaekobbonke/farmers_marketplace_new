import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commodity: string }> }
) {
  try {
    const { commodity } = await params;
    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days') || 30;
    
    const response = await fetch(
      `${EXPRESS_URL}/assistant/forecast/trends/${commodity}?days=${days}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}