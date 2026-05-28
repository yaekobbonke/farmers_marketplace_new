import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ForecastResponse = {
  success: boolean;
  data?: unknown;
  message?: string;
};

// Removed the `{ params }` object entirely since Next.js treats this as a static URL path
export async function GET(req: NextRequest) {
  try {
    // 1. Extract the productId from the query string (?productId=xxx)
    const { searchParams } = req.nextUrl;
    const productId = searchParams.get("productId");

    // 2. Validate that the productId was actually sent by the frontend
    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing 'productId' query parameter",
        },
        { status: 400 }
      );
    }

    const token = req.headers.get("authorization");

    // Forward the request to your Express backend using the extracted productId
    const response = await fetch(
      `${EXPRESS_URL}/assistant/forecast/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
      }
    );

    const data: ForecastResponse = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}