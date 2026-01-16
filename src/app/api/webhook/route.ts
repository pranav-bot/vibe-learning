import { Webhooks } from "@dodopayments/nextjs";
import { db } from "~/server/db";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,

  onSubscriptionActive: async (payload) => {
    console.log("Received onSubscriptionActive webhook:", payload);

    // Add your business logic here
  },

  onPaymentSucceeded: async (payload) => {
    console.log("Received onPaymentSucceeded webhook:", payload);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { customer, metadata, payment_id } = payload as any; 
    
    if (!metadata?.userId && !customer?.email) {
      console.error("No userId or email found in payload");
      return;
    }

    try {
      const userId = metadata?.userId;
      const email = customer?.email;

      // Find profile
      const profile = userId
        ? await db.profile.findUnique({ where: { id: userId } })
        : await db.profile.findUnique({ where: { email: email } });

      if (!profile) {
        console.error("Profile not found for payment", payment_id);
        return;
      }

      // Add credits (assuming 1 credit per purchase for now, or derive from amount)
      // Since product is fixed price 100 ($1.00) for 1 credit.
      // We can just add 1 credit.

      await db.$transaction([
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
            description: `Purchase via Dodo Payments (${payment_id})`,
            profileId: profile.id,
          },
        }),
      ]);

      console.log(`Added 1 credit to user ${profile.id}`);
    } catch (error) {
      console.error("Error processing webhook:", error);
      throw error; // Rethrow to let Dodo know it failed (500)
    }
  },
});