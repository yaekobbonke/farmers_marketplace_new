// app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";

// In production, store this in a database
let subscribers: string[] = [];

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    if (subscribers.includes(email)) {
      return NextResponse.json(
        { message: "Email already subscribed" },
        { status: 400 }
      );
    }

    // Add to subscribers list
    subscribers.push(email);
    
    // In production, save to database:
    // await prisma.newsletter.create({ data: { email } });

    // Optional: Send welcome email
    // await sendWelcomeEmail(email);

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { message: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check subscribers (protected)
export async function GET(request: NextRequest) {
  // Add authentication check here
  const authHeader = request.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  return NextResponse.json({ subscribers, count: subscribers.length }, { status: 200 });
}