'use client';

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { 
  BookOpen,
  Send,
  Zap,
} from "lucide-react";
import DifficultyDialog from "~/components/DifficultyDialog";
import ProductCard from "~/components/ProductCard";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { globalFetch } from "~/lib/globalFetch";
import { toast } from "sonner";

interface GenerateClientProps {
  user: User;
  credits: number;
}

// Minimal type definition to avoid importing from mjs if it causes issues
interface Product {
    product_id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
}

export default function GenerateClient({ user, credits }: GenerateClientProps) {
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);


  useEffect(() => {
    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await globalFetch('/api/products');
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    }
    fetchProducts();
  }, []);

  const handlePayClick = async (product: Product) => {
    try {
        const response = await globalFetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.product_id,
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else if (data.checkout_url) {
            window.location.href = data.checkout_url;
        } else if (data.payment_link) { // Start checking payment_link too just in case
             window.location.href = data.payment_link;
        }
        else {
            toast.error("Failed to create checkout session");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    
    // Show difficulty dialog instead of handling submission here
    setShowDifficultyDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <BookOpen className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              What Would You Like to Learn?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Enter any topic and we&apos;ll create a personalized learning experience for you
            </p>

            <div className="flex flex-col gap-4 mb-8 items-center">
                <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-4 justify-between max-w-md w-full border border-border">
                    <div className="flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${credits > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
                        <span className="font-semibold">
                            {credits} Credit{credits !== 1 ? 's' : ''} Available
                        </span>
                    </div>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Buy Credits</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle className="text-center">Upgrade Plan</DialogTitle>
                             </DialogHeader>
                             <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto p-1">
                                 {loadingProducts ? (
                                     <div className="mx-auto py-8">Loading products...</div>
                                 ) : products.length > 0 ? (
                                    products.map(product => (
                                        <ProductCard
                                            key={product.product_id}
                                            title={product.name}
                                            description={product.description}
                                            price={product.price}
                                            currency={product.currency}
                                            onPayClick={() => handlePayClick(product)}
                                        />
                                    ))
                                 ) : (
                                     <div className="text-center text-muted-foreground">No products available.</div>
                                 )}
                             </div>
                        </DialogContent>
                    </Dialog>
                </div>
                
                 {credits === 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg max-w-md w-full border border-blue-200 dark:border-blue-800">
                        <div className="flex flex-col gap-2 text-center items-center">
                            <p className="text-sm text-muted-foreground">
                                No credits? Check out free roadmaps made by the community.
                            </p>
                            <Link href="/trending">
                                <Button variant="link" size="sm" className="text-blue-600 dark:text-blue-400 p-0 h-auto font-semibold">
                                    Explore Trending Roadmaps <span aria-hidden="true">&rarr;</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="topic" className="text-sm font-medium text-left block">
                  Topic Name
                </label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="e.g., Machine Learning, React Development, Photography..."
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="text-lg py-3"
                />
              </div>

              {/* <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium text-left block">
                  Difficulty
                </label>
                <Select
                  value={difficulty}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") => setDifficulty(value)}
                >
                  <SelectTrigger id="difficulty" className="text-s py-3">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full flex items-center gap-2"
                disabled={!topicName.trim()}
              >
                <Send className="h-5 w-5" />
                Start Learning
              </Button>

              {/* Popular topics moved inside the card */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Popular topics to get you started:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Machine Learning',
                    'Web Development',
                    'Data Science',
                    'Digital Marketing',
                    'Photography',
                    'Python Programming',
                    'UI/UX Design',
                    'Blockchain'
                  ].map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      onClick={() => setTopicName(topic)}
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </form>
          </Card>
        </div>
      </main>

      {/* Difficulty Dialog */}
      <DifficultyDialog
        isOpen={showDifficultyDialog}
        onClose={() => {
          setShowDifficultyDialog(false);
          setTopicName(''); // Reset topic name when dialog is closed
          setDifficulty("beginner");
        }}
        courseTitle={topicName}
        initialDifficulty={difficulty}
      />
    </div>
  );
}
