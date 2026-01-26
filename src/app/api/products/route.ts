import { NextResponse } from "next/server";
import { dodopayments } from "~/lib/dodo-payments"

export const GET = async (request) => {
    const products = await dodopayments.products.list();
    return NextResponse.json(products.items);
}