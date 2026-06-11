import { NextRequest, NextResponse } from "next/server";

// Dynamic mapping for region coordinates and market IDs
const REGION_MAP: Record<
  string,
  {
    admin1: string;
    market_id: number;
    latitude: number;
    longitude: number;
  }
> = {
  "ADDIS ABABA": {
    admin1: "Addis Ababa",
    market_id: 480,
    latitude: 9.02,
    longitude: 38.75,
  },
  OROMIA: {
    admin1: "Oromia",
    market_id: 500,
    latitude: 8.98,
    longitude: 37.85,
  },
  AMHARA: {
    admin1: "Amhara",
    market_id: 510,
    latitude: 11.59,
    longitude: 37.39,
  },
  TIGRAY: {
    admin1: "Tigray",
    market_id: 520,
    latitude: 13.49,
    longitude: 39.47,
  },
  SIDAMA: {
    admin1: "Sidama",
    market_id: 530,
    latitude: 6.96,
    longitude: 38.8,
  },
  "SOUTH ETHIOPIA": {
    admin1: "South Ethiopia",
    market_id: 540,
    latitude: 6.1,
    longitude: 37.6,
  },
};

// Maps IDs to names, categories, and baseline pricing features for XGBoost
const COMMODITY_MAP: Record<number, { name: string; category: string; rfq: number; r3q: number }> = {
  67: { name: "Teff", category: "cereals and tubers", rfq: 55, r3q: 52 },
  1:  { name: "Maize (white)", category: "cereals and tubers", rfq: 35, r3q: 33 },
  2:  { name: "Wheat", category: "cereals and tubers", rfq: 40, r3q: 38 },
  3:  { name: "Coffee", category: "export crops", rfq: 350, r3q: 340 },
  4:  { name: "Barley", category: "cereals and tubers", rfq: 32, r3q: 30 },
  5:  { name: "Sorghum", category: "cereals and tubers", rfq: 28, r3q: 26 },
};

export async function GET(request: NextRequest) {
  console.log("Vercel Proxy calling Local XGBoost Model");

  try {
    const searchParams = request.nextUrl.searchParams;

    const productId = searchParams.get("productId");
    const commodityParam = searchParams.get("commodity");
    const regionParam = searchParams.get("region");

    console.log("Received request params:", {
      productId,
      commodity: commodityParam,
      region: regionParam,
    });

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 }
      );
    }

    const FASTAPI_URL = process.env.FASTAPI_URL;
    if (!FASTAPI_URL) {
      console.error("FASTAPI_URL configuration is missing in environment variables!");
      return NextResponse.json(
        {
          success: false,
          error: "Backend API URL configuration is missing",
        },
        { status: 500 }
      );
    }

    const commodityId = Number(productId);

    // 1. Resolve Region features safely
    const normalizedRegion = regionParam ? regionParam.toUpperCase().trim() : "ADDIS ABABA";
    const regionData = REGION_MAP[normalizedRegion] || REGION_MAP["ADDIS ABABA"];

    // 2. Resolve Commodity features and baseline ML inputs dynamically
    const dynamicFeatures = COMMODITY_MAP[commodityId];
    
    const commodityName = commodityParam || dynamicFeatures?.name || "Unknown Commodity";
    const categoryName = dynamicFeatures?.category || "cereals and tubers";
    const rfqBaseline = dynamicFeatures?.rfq || 40;
    const r3qBaseline = dynamicFeatures?.r3q || 38;

    // 3. Assemble complete ML feature payload
    const payload = {
      admin1: regionData.admin1,
      market_id: regionData.market_id,
      commodity_id: commodityId,
      commodity: commodityName,
      category: categoryName,
      latitude: regionData.latitude,
      longitude: regionData.longitude,
      rfq: rfqBaseline,
      r3q: r3qBaseline,
      include_trend: true,
    };

    console.log("=================================");
    console.log("Sending payload to FastAPI:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("=================================");

    const targetUrl = `${FASTAPI_URL}/api/v1/forecast/predict`;

    const aiResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
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
          status: aiResponse.status,
        },
        { status: aiResponse.status }
      );
    }

    const realAIData = await aiResponse.json();

    console.log("Prediction received successfully:");
    console.log(JSON.stringify(realAIData, null, 2));

    return NextResponse.json({
      success: true,
      data: realAIData,
      message: "Prediction generated successfully",
    });
  } catch (error) {
    console.error("Proxy Prediction API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to communicate with FastAPI server",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, OPTIONS",
    },
  });
}
