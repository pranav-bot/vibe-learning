import type { APIError } from "dodopayments";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dodopayments } from "~/lib/dodo-payments";
import { createClient } from "~/utils/supabase/server";



const validator = z.object({
  productId: z.string(),

})
export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }
  const body = await request.json();
  const parser = validator.safeParse(body);

  if(parser.success) {
    const { productId } = parser.data;
    try {
      const payment = await dodopayments.payments.create({
        billing: {
          city: "",
          country: "IN",
          state: "",
          street: "",
          zipcode: ""
        },
        customer: {
          email: user.email ?? '',
          name: '',
        },
        payment_link: true,
        return_url: process.env.DODO_PAYMENTS_RETURN_URL,
        product_cart: [{
          product_id: productId, quantity: 1}]
      });
      return NextResponse.json(payment, { status: 200 });
    }
    catch(e){
      const dodopaymentError = e as APIError;
      return NextResponse.json({ error: dodopaymentError.message }, { status: dodopaymentError.status });
    }

  } else {
    return NextResponse.json(parser.error, { status: 400 });
  }
}