"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { globalFetch } from "~/lib/globalFetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { countries } from "~/lib/countries";

interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
}

interface PaymentResponse {
    url?: string;
    checkout_url?: string;
    payment_link?: string;
}

const ProductsList = ({ trigger, user }: { trigger?: React.ReactNode; user?: User }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [billingDetails, setBillingDetails] = useState({
    name: user?.user_metadata?.full_name as string ?? "",
    email: user?.email ?? "",
    country: "",
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
        setBillingDetails(prev => ({
            ...prev,
            email: user.email ?? prev.email,
            name: (user.user_metadata?.full_name as string) ?? prev.name
        }));
    }
  }, [user]);

  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await globalFetch("/api/products");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        const allowedIds = ["pdt_0NW8bYSGgYoigI26uBq9b", "pdt_0NW8SzWqOgaUKUbv9QWbx"];
        const allProducts = Array.isArray(data) ? data : [];
        setProducts(allProducts.filter((p: Product) => allowedIds.includes(p.product_id)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProducts();
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayClick = async () => {
    if (!selectedProduct) return;
    if (!billingDetails.name || !billingDetails.email || !billingDetails.country) {
      toast.error("Please fill in all fields");
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await globalFetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.product_id,
          name: billingDetails.name,
          email: billingDetails.email,
          country: billingDetails.country,
        }),
      });
      const data = (await response.json()) as PaymentResponse;
      if (data.url) {
        window.location.href = data.url;
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => { if (!open) { setStep(1); setSelectedProduct(null); } }}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add Credits</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 1 ? "Upgrade Plan" : "Billing Details"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <p className="text-center text-sm text-muted-foreground px-2">
            Make your existing roadmaps public and earn credits if they reach 50 upvotes.
          </p>
        )}
        
        {step === 1 ? (
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto p-1">
            {loading ? (
              <div className="mx-auto py-8">Loading products...</div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.product_id}
                  title={product.name}
                  description={product.description}
                  price={product.price}
                  currency={product.currency}
                  onPayClick={() => handleProductSelect(product)}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                No products available.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={billingDetails.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={billingDetails.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {billingDetails.country
                      ? countries.find((country) => country.code === billingDetails.country)?.name
                      : "Select country..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                        {countries.map((country) => (
                            <CommandItem
                            key={country.code}
                            value={country.name}
                            onSelect={(currentValue) => {
                                setBillingDetails((prev) => ({ ...prev, country: country.code }));
                                setOpen(false);
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                billingDetails.country === country.code ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {country.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex gap-2 justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)} disabled={processingPayment}>
                Back
              </Button>
              <Button onClick={handlePayClick} disabled={processingPayment}>
                {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductsList;
