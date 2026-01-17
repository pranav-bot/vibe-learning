import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { createClient } from "~/utils/supabase/server";
import DodoPayments from "dodopayments";

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    console.log(`User ${user.id} attempting to redeem credits for payment ${paymentId}`);

    // 2. Check for existing transaction (Idempotency)
    const existingTx = await db.creditTransaction.findFirst({
        where: { description: `Purchase via Dodo Payments (${paymentId})` }
    });

    if (existingTx) {
         console.log(`Payment ${paymentId} already processed.`);
         return NextResponse.json({ success: true, message: "Credits already added" });
    }

    // 3. Verify Payment with Dodo
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode",
    });

    const payment = await client.payments.get(paymentId);

    if (payment.status !== "succeeded") {
       console.error(`Payment ${paymentId} status is ${payment.status}, expected succeeded`);
       return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    // 4. Update DB
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
          description: `Purchase via Dodo Payments (${paymentId})`,
          profileId: user.id,
        },
      }),
    ]);

    console.log(`Successfully redeemed credit for user ${user.id}.`);
    return NextResponse.json({ success: true, newCredits: result[0].credits });

  } catch (error) {
    console.error("Error redeeming credits:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
