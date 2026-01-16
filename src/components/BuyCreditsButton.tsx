'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { products } from "~/lib/products";
import type { User } from "@supabase/supabase-js";

interface BuyCreditsButtonProps {
    user: User;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    showPrice?: boolean;
}

export function BuyCreditsButton({ user, className, variant = "default", size = "default", showPrice = true }: BuyCreditsButtonProps) {
    const [buying, setBuying] = useState(false);

    const handleBuyCredits = async () => {
        try {
            setBuying(true);
            const product = products[0]; // Assuming first product is 1 Credit

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_cart: [{
                        product_id: product.product_id,
                        quantity: 1
                    }],
                    billing: {
                        city: "New York",
                        country: "US",
                        state: "NY",
                        street: "123 Main St",
                        zipcode: "10001"
                    },
                    customer: {
                        email: user.email,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        name: user.user_metadata?.full_name || (user as any).email,
                    },
                    metadata: {
                        userId: user.id,
                    }
                }),
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: any = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                toast.error("Failed to create checkout session");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setBuying(false);
        }
    };

    return (
        <Button onClick={handleBuyCredits} disabled={buying} className={className} variant={variant} size={size}>
            {buying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Buy 1 Credit {showPrice && "(₹100 / $1.00)"}
        </Button>
    );
}
