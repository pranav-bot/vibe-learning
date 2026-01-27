import { Webhooks } from "@dodopayments/nextjs";
import { createClient } from "~/utils/supabase/server";
import db from "~/server/db";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? '',

  onPaymentSucceeded: async (payload) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payloadData = payload as any;
    const paymentId = payloadData.data?.payment_id ?? payloadData.payment_id;
  },
});