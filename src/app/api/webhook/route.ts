import { Webhooks } from "@dodopayments/nextjs";
import { db } from "~/server/db";

type DodoWebhookPayload = {
  data?: {
    payment_id?: string;
  };
  payment_id?: string;
};


export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "",

  onPaymentSucceeded: async (payload) => {
    const payloadData = payload as DodoWebhookPayload;

    const paymentId = payloadData.data?.payment_id ?? payloadData.payment_id;

    if (!paymentId) {
      console.error("Missing payment_id in webhook payload");
      return;
    }

    await db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { paymentId: paymentId },
      });

      if (!payment) {
        console.error(`Payment with ID ${paymentId} not found`);
        return;
      }

      // 🔁 Idempotency guard
      if (payment.status === "SUCCEEDED") {
        return;
      }

      const creditsToAdd =
        payment.productType === "SINGLE_CREDIT" ? 1 : 5;

      // 1️⃣ Mark payment as succeeded
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED" },
      });

      // 2️⃣ Increment credits
      await tx.profile.update({
        where: { id: payment.profileId },
        data: {
          credits: {
            increment: creditsToAdd,
          },
        },
      });

      // 3️⃣ (Recommended) Record credit transaction
      await tx.creditTransaction.create({
        data: {
          profileId: payment.profileId,
          amount: creditsToAdd,
          type: "PURCHASE",
          description: "Dodo payment successful",
        },
      });
    });
  },
    onPaymentFailed: async (payload) => {
    const payloadData = payload as DodoWebhookPayload;
    const paymentId = payloadData.data?.payment_id ?? payloadData.payment_id;
    if (!paymentId) return console.error("Missing payment_id in webhook payload");

    await db.payment.update({
      where: { paymentId },
      data: { status: "FAILED" },
    });

    console.log(`Payment ${paymentId} marked as FAILED`);

    // Optional: notify user via email or push notification
    // e.g., sendEmail(payment.profileId, "Payment Failed", "Your payment could not be processed.");
  },
    onPaymentCancelled: async (payload) => {
    const payloadData = payload as DodoWebhookPayload;
    const paymentId = payloadData.data?.payment_id ?? payloadData.payment_id;
    if (!paymentId) return console.error("Missing payment_id in webhook payload");

    await db.payment.update({
      where: { paymentId },
      data: { status: "CANCELLED" },
    });

    console.log(`Payment ${paymentId} marked as CANCELLED`);
  },
});