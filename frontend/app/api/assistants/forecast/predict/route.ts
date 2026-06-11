import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("Vercel Proxy calling Local XGBoost Model");

  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    console.log("Product ID received from frontend:", productId);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID is required'
        },
        { status: 400 }
      );
    }

    const FASTAPI_URL = process.env.FASTAPI_URL;

    if (!FASTAPI_URL) {
      console.error("Environment variable FASTAPI_URL is missing in Vercel!");

      return NextResponse.json(
        {
          success: false,
          error: 'Backend API URL configuration is missing'
        },
        { status: 500 }
      );
    }

    const localTargetUrl = `${FASTAPI_URL}/api/v1/forecast/predict`;

    console.log(`Forwarding payload to: ${localTargetUrl}`);

    // Same payload that works in Swagger
    const payload = {
      admin1: "Addis Ababa",
      market_id: 480,
      commodity_id: parseInt(productId),
      category: "cereals and tubers",
      commodity: "Maize (white)",
      latitude: 9.02,
      longitude: 38.75,
      rfq: 0,
      r3q: 0,
      include_trend: true
    };

    console.log("Sending payload:", payload);

    const aiResponse = await fetch(localTargetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();

      console.error("========== FASTAPI ERROR ==========");
      console.error(`Status: ${aiResponse.status}`);
      console.error(errorText);
      console.error("===================================");

      return NextResponse.json(
        {
          success: false,
          error: errorText,
          status: aiResponse.status
        },
        { status: aiResponse.status }
      );
    }

    const realAIData = await aiResponse.json();

    console.log("Real prediction calculated successfully");

    return NextResponse.json({
      success: true,
      data: realAIData,
      message: 'Prediction generated successfully from XGBoost Model'
    });

  } catch (error) {
    console.error('Proxy Prediction API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to communicate with FastAPI server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, OPTIONS',
    },
  });
}
