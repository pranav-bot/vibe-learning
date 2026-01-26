"use client";

import {
  Products,
  type PaymentCreateResponse,
  type ProductListResponse,
} from "dodopayments/resources/index.mjs";

import React from "react";
import ProductCard from "./ProductCard";
import { globalFetch } from "~/lib/globalFetch";

const ProductsList = ({ products }: { products: ProductListResponse[] }) => {
  const handlePayClick = async (productId: string) => {
    const response = await globalFetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: productId,
      }),
    });
    const body = (await response.json()) as PaymentCreateResponse;
    console.log(body);
  };
  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.product_id}
          title={product.name}
          description={product.description}
          price={product.price}
          currency={product.currency}
          onPayClick={() => handlePayClick(product)}
        />
      ))}
    </div>
  );
};

export default ProductsList;
