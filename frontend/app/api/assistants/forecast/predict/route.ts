import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("🚀 Prediction API was called");
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    
    console.log("📊 Product ID received:", productId);
    
    if (!productId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Mock data for different products
    const productData: Record<number, any> = {
      1: { name: 'Maize (White)', price: 35, trend: 'up', confidence: 88 },
      2: { name: 'Wheat', price: 40, trend: 'up', confidence: 85 },
      3: { name: 'Coffee', price: 350, trend: 'up', confidence: 92 },
      4: { name: 'Barley', price: 32, trend: 'down', confidence: 78 },
      5: { name: 'Sorghum', price: 28, trend: 'stable', confidence: 84 },
      67: { name: 'Teff', price: 55, trend: 'up', confidence: 90 },
    };
    
    const id = parseInt(productId);
    const product = productData[id] || {
      name: 'Unknown Product',
      price: 50,
      trend: 'stable',
      confidence: 75
    };
    
    // Calculate predicted price
    let predictedPrice = product.price;
    if (product.trend === 'up') {
      predictedPrice = Math.round(product.price * 1.12);
    } else if (product.trend === 'down') {
      predictedPrice = Math.round(product.price * 0.92);
    } else {
      predictedPrice = Math.round(product.price * 1.02);
    }
    
    const response = {
      success: true,
      data: {
        productId: id,
        commodity: product.name,
        region: 'ADDIS ABABA',
        predicted_price_etb: predictedPrice,
        current_market_baseline: product.price,
        price_range: {
          low: Math.round(predictedPrice * 0.85),
          high: Math.round(predictedPrice * 1.15),
        },
        trend: product.trend === 'up' ? 'increasing' : product.trend === 'down' ? 'decreasing' : 'stable',
        confidence: product.confidence,
        productName: product.name,
        currentPrice: product.price,
        predictedPrice: predictedPrice,
      },
      message: 'Prediction generated successfully',
    };
    
    console.log("✅ Sending response for product:", product.name);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Prediction API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate prediction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, OPTIONS',
    },
  });
}