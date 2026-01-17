import { Webhooks } from "@dodopayments/nextjs";
import { db } from "~/server/db";
import { NextResponse } from "next/server";
import { createClient } from "~/utils/supabase/server";

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
    
    // Extract payment ID from payload
    const paymentId = payloadData.data?.payment_id ?? payloadData.payment_id;

    if (!paymentId) {
      console.error("No payment_id found in webhook payload");
      return;
    }

    try {
      // 1. Identify the user using Supabase Auth (server-side)
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("No authenticated user found via Supabase Auth. Cannot process payment.", authError);
        return;
      }

      console.log(`Processing payment ${paymentId} for authenticated UserID: ${user.id}`);

      // 2. Find profile in Prisma
      const profile = await db.profile.findUnique({
        where: { id: user.id }
      });

      if (!profile) {
        console.error(`Profile not found for authenticated user ${user.id}`);
        return;
      }

      // 3. Prevent duplicate processing
      const description = `Purchase via Dodo Payments (${paymentId})`;
      const existingTransaction = await db.creditTransaction.findFirst({
        where: { description }
      });

      if (existingTransaction) {
        console.log(`Payment ${paymentId} already processed. Skipping.`);
        return;
      }

      console.log(`Adding 1 credit to user ${user.id}...`);

      // 4. Execute transaction
      const result = await db.$transaction([
        db.profile.update({
          where: { id: user.id },
          data: {
            credits: { increment: 1 },
          },
        }),
        db.creditTransaction.create({
          data: {
            amount: 1,
            type: "PURCHASE",
            description: description,
            profileId: user.id,
          },
        }),
      ]);

      console.log(`Successfully added 1 credit to user ${user.id}. Result:`, result);
    } catch (error) {
        console.error("Error processing webhook:", error);
        throw error; 
    }
  },
});

export function GET() {
    return NextResponse.redirect(new URL("/profile", process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
}