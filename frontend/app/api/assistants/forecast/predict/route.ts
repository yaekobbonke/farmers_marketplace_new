import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("🚀 Vercel Proxy calling Local XGBoost Model");
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    
    console.log("📊 Product ID received from frontend:", productId);
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Updated to pull from FASTAPI_URL
    const FASTAPI_URL = process.env.FASTAPI_URL;

    if (!FASTAPI_URL) {
      console.error("❌ Environment variable FASTAPI_URL is missing in Vercel!");
      return NextResponse.json(
        { success: false, error: 'Backend API URL configuration is missing' },
        { status: 500 }
      );
    }

    // Target your exact prediction endpoint layout
    const localTargetUrl = `${FASTAPI_URL}/api/v1/forecast/predict`;
    console.log(`🔗 Forwarding payload to: ${localTargetUrl}`);
    
    const aiResponse = await fetch(localTargetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Bypasses the ngrok phishing warning interstitial screen
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ 
        product_id: parseInt(productId)
      }),
      cache: 'no-store', 
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ Local FastAPI returned error (${aiResponse.status}):`, errorText);
      return NextResponse.json(
        { success: false, error: `Local AI Service Error: ${aiResponse.statusText}` },
        { status: aiResponse.status }
      );
    }

    const realAIData = await aiResponse.json();
    console.log("✅ Real prediction calculated by local XGBoost successfully");

    return NextResponse.json({
      success: true,
      data: realAIData,
      message: 'Prediction generated successfully from local XGBoost Model'
    });
    
  } catch (error) {
    console.error('❌ Proxy Prediction API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to communicate with local machine server over ngrok',
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