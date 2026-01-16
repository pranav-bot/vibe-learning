import { Webhooks } from "@dodopayments/nextjs";
import { db } from "~/server/db";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,

  onSubscriptionActive: async (payload) => {
    console.log("Received onSubscriptionActive webhook:", payload);

    // Add your business logic here
  },

  onPaymentSucceeded: async (payload) => {
    console.log("Received onPaymentSucceeded webhook:", JSON.stringify(payload, null, 2));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { customer, metadata, payment_id } = payload as any; 
    
    // Check various possible locations for metadata/customer
    // Dodo payload might be structured differently depending on the event version
    // Sometimes the resource is wrapped in `data`
    // const actualMetadata = metadata || (payload as any).data?.metadata;
    // const actualCustomer = customer || (payload as any).data?.customer;

    if (!metadata?.userId && !customer?.email) {
      console.error("No userId or email found in payload", payload);
      return;
    }

    try {
      const userId = metadata?.userId;
      const email = customer?.email;
      console.log(`Processing payment for UserID: ${userId}, Email: ${email}`);

      // Find profile
      const profile = userId
        ? await db.profile.findUnique({ where: { id: userId } })
        : await db.profile.findUnique({ where: { email: email } });

      if (!profile) {
        console.error("Profile not found for payment", payment_id);
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
            description: `Purchase via Dodo Payments (${payment_id})`,
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