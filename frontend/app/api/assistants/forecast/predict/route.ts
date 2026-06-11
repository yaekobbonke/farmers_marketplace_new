import { NextRequest, NextResponse } from "next/server";

// Static mapping for known regional training data configurations
const REGION_MAP: Record<
  string,
  {
    admin1: string;
    market_id: number;
    latitude: number;
    longitude: number;
  }
> = {
  "ADDIS ABABA": { admin1: "Addis Ababa", market_id: 480, latitude: 9.02, longitude: 38.75 },
  OROMIA:        { admin1: "Oromia",      market_id: 500, latitude: 8.98, longitude: 37.85 },
  AMHARA:        { admin1: "Amhara",      market_id: 510, latitude: 11.59, longitude: 37.39 },
  TIGRAY:        { admin1: "Tigray",      market_id: 520, latitude: 13.49, longitude: 39.47 },
  SIDAMA:        { admin1: "Sidama",      market_id: 530, latitude: 6.96,  longitude: 38.8  },
  "SOUTH ETHIOPIA": { admin1: "South Ethiopia", market_id: 540, latitude: 6.1, longitude: 37.6 },
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
  console.log("Next.js Proxy handling dynamic prediction request");

  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const commodityParam = searchParams.get("commodity");
    const regionParam = searchParams.get("region");

    const normalizedProduct = commodityParam ? commodityParam.trim().toUpperCase() : "";
    const normalizedRegion = regionParam ? regionParam.trim().toUpperCase() : "";

    console.log("Normalized parameters:", { productId, normalizedProduct, normalizedRegion });

    const commodityId = Number(productId);
    const hasKnownProduct = !isNaN(commodityId) && !!COMMODITY_MAP[commodityId];
    const hasKnownRegion = !!REGION_MAP[normalizedRegion];

    // =========================================================================
    // CASE: UNTRAINED PARAMETERS FALLBACK
    // If frontend sent unindexed tokens, return a clean structured fallback directly.
    // =========================================================================
    if (!hasKnownProduct || !hasKnownRegion) {
      console.log("⚠️ Target parameters outside AI training data. Serving statistical fallback.");

      let baselinePrice = 45;
      if (hasKnownProduct) {
        baselinePrice = COMMODITY_MAP[commodityId].rfq;
      } else if (normalizedProduct) {
        // Safe, pseudo-random but predictable math loop for completely custom products
        baselinePrice = 25 + (normalizedProduct.length * 3) % 120;
      }

      const regionalSkew = hasKnownRegion ? 1.05 : 0.95;
      const predictedPrice = Math.round(baselinePrice * regionalSkew);

      return NextResponse.json({
        success: true,
        message: "Generated fallback prediction for untrained matrix context",
        prediction: {
          commodity: normalizedProduct || "Unknown Crop",
          region: normalizedRegion || "Unknown Region",
          predicted_price_etb: predictedPrice,
          current_market_baseline: hasKnownProduct ? baselinePrice : null,
          price_range: {
            low: Math.round(predictedPrice * 0.80),
            high: Math.round(predictedPrice * 1.20),
          },
          trend: "stable",
          confidence: 30, // Low confidence alert match
          isFallback: true,
        },
      });
    }

    // =========================================================================
    // CASE: KNOWN PARAMETERS -> DISPATCH TO NGROK / FASTAPI MODEL
    // =========================================================================
    const FASTAPI_URL = process.env.FASTAPI_URL;
    if (!FASTAPI_URL) {
      console.error("Missing FASTAPI_URL setup!");
      return NextResponse.json(
        { success: false, error: "Backend API URL route configuration is missing" },
        { status: 500 }
      );
    }

    const regionData = REGION_MAP[normalizedRegion];
    const dynamicFeatures = COMMODITY_MAP[commodityId];

    const payload = {
      admin1: regionData.admin1,
      market_id: regionData.market_id,
      commodity_id: commodityId,
      commodity: dynamicFeatures.name,
      category: dynamicFeatures.category,
      latitude: regionData.latitude,
      longitude: regionData.longitude,
      rfq: dynamicFeatures.rfq,
      r3q: dynamicFeatures.r3q,
      include_trend: true,
    };

    console.log(`Forwarding validated ML payload to FastAPI: ${FASTAPI_URL}`);

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
      console.error(`FastAPI execution error [Status ${aiResponse.status}]:`, errorText);
      
      // If the backend drops connection or acts up, default cleanly to local statistical mock
      return NextResponse.json({
        success: true,
        prediction: {
          commodity: dynamicFeatures.name,
          region: regionData.admin1.toUpperCase(),
          predicted_price_etb: Math.round(dynamicFeatures.rfq * 1.05),
          current_market_baseline: dynamicFeatures.rfq,
          price_range: {
            low: Math.round(dynamicFeatures.rfq * 0.90),
            high: Math.round(dynamicFeatures.rfq * 1.15),
          },
          trend: "stable",
          confidence: 65,
          isFallback: true,
        }
      });
    }

    const realAIData = await aiResponse.json();

    return NextResponse.json({
      success: true,
      data: realAIData,
      message: "Prediction generated successfully from live ML weights",
    });

  } catch (error) {
    console.error("Proxy Prediction Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to communicate with prediction systems",
        details: error instanceof Error ? error.message : "Unknown structural error",
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
