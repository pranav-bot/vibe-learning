import { Webhooks } from "@dodopayments/nextjs";
import { db } from "~/server/db";
import { NextResponse } from "next/server";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,

  onSubscriptionActive: async (payload) => {
    console.log("Received onSubscriptionActive webhook:", payload);

    // Add your business logic here
  },

  onPaymentSucceeded: async (payload) => {
    console.log("Received onPaymentSucceeded webhook:", JSON.stringify(payload, null, 2));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payloadData = payload as any;
    
    // Check various possible locations for metadata/customer
    // Dodo payload might be structured differently depending on the event version
    // Sometimes the resource is wrapped in `data`
    const metadata = payloadData.metadata || payloadData.data?.metadata;
    const customer = payloadData.customer || payloadData.data?.customer;
    const paymentId = payloadData.payment_id || payloadData.data?.payment_id || "unknown_payment_id";

    if (!metadata?.userId) {
      console.error("No userId found in metadata", payload);
      return;
    }

    try {
      const userId = metadata?.userId;
      const email = customer?.email;
      console.log(`Processing payment for UserID from metadata: ${userId}, Email: ${email}`);

      let profile = null;

      // 1. Try finding by ID (Most reliable if metadata exists)
      if (userId) {
         profile = await db.profile.findUnique({ where: { id: userId } });
      }

      // 2. Fallback to Email (If metadata is empty/stripped)
      // We must use this because the Dodo payload sometimes strips metadata in test mode,
      // and this is the only way to link the payment to the user account.
      if (!profile && email) {
      console.log("Metadata userId not found or profile missing. Falling back to email lookup.");
         profile = await db.profile.findUnique({ where: { email: email } });
      }

      if (!profile) {
        console.error("Profile not found for payment", paymentId);
        return;
      }

      if (!profile) {
        console.error("Profile not found for payment", paymentId);
        return;
      }

      console.log(`Found profile: ${profile.id}. Adding credits...`);

      // Add credits (assuming 1 credit per purchase for now, or derive from amount)
      // Since product is fixed price 100 ($1.00) for 1 credit.
      // We can just add 1 credit.

      const result = await db.$transaction([
        db.profile.update({
          where: { id: profile.id },
          data: {
            credits: { increment: 1 },
          },
        }),
        db.creditTransaction.create({
          data: {
            amount: 1,
            type: "PURCHASE",
            description: `Purchase via Dodo Payments (${paymentId})`,
            profileId: profile.id,
          },
        }),
      ]);

      console.log(`Successfully added 1 credit to user ${profile.id}. New Balance details:`, result[0]);
    } catch (error) {
        console.error("Error processing webhook:", error);
        throw error; 
    }
  },
});

export function GET() {
    return NextResponse.redirect(new URL("/profile", process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
}