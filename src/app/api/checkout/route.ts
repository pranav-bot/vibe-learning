import type { APIError } from "dodopayments";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dodopayments } from "~/lib/dodo-payments";
import { createClient } from "~/utils/supabase/server";
import { db } from "~/server/db";

const validator = z.object({
  productId: z.string(),
  name: z.string(),
  email: z.string().email(),
  country: z.string(),
});
export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parser = validator.safeParse(body);

  if (parser.success) {
    const { productId, name, email, country } = parser.data;
    try {
      const payment = await dodopayments.payments.create({
        billing: {
          country: country ?? "IN",
          city: "",
          state: "",
          street: "",
          zipcode: "",
        },
        customer: {
          email: email,
          name: name,
        },
        payment_link: true,
        return_url: process.env.DODO_PAYMENTS_RETURN_URL,
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
      });
      const profile = await db.profile.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
        },
      });


      await db.payment.create({
        data: {
          paymentId: payment.payment_id,
          provider: "dodo",
          productID: productId,
          productType:
            productId === "pdt_0NW8SzWqOgaUKUbv9QWbx" ? "SINGLE_CREDIT" : "FIVE_CREDITS",
          country: country ?? "IN",
          status: "PENDING",
          profileId: profile.id,
        },
      });
      return NextResponse.json(payment, { status: 200 });
    } catch (e) {
      const dodopaymentError = e as APIError;
      return NextResponse.json(
        { error: dodopaymentError.message },
        { status: dodopaymentError.status },
      );
    }
  } else {
    return NextResponse.json(parser.error, { status: 400 });
  }
};
