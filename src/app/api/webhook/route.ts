import { Webhooks } from "@dodopayments/nextjs";
import { NextResponse } from "next/server";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,

  onSubscriptionActive: async (payload) => {
    console.log("Received onSubscriptionActive webhook:", payload);

    // Add your business logic here
  },

  onPaymentSucceeded: async (payload) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payloadData = payload as any;
    const paymentId = payloadData.data?.payment_id ?? payloadData.payment_id;
    console.log("Received onPaymentSucceeded webhook. Payment confirmed:", paymentId);
    
    // Logic for crediting the user is now handled in /api/credits/redeem 
    // which is called by the client after successful redirect.
  },
});

export function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Assuming Dodo passes 'status' param in the return URL
    const status = searchParams.get("status") || "succeeded"; 

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";

    if (status === "failed") {
        return NextResponse.redirect(new URL("/payment-failed", baseUrl));
    }
    
    if (status === "processing") {
        return NextResponse.redirect(new URL("/payment-processing", baseUrl));
    }

    return NextResponse.redirect(new URL("/profile", baseUrl));
}