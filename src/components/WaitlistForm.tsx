"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { CheckCircle, Mail, Users, Zap } from "lucide-react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call - replace with actual waitlist API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsLoading(false);
    setEmail("");
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto bg-background/80 backdrop-blur-sm border-2 border-green-500/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold text-foreground">You're In!</h3>
            <p className="text-muted-foreground">
              Thanks for joining our waitlist. We'll notify you as soon as Knowful is ready.
            </p>
            <Badge variant="secondary" className="mt-4">
              Early Access Secured
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Waitlist Card */}
      <Card className="bg-background/80 backdrop-blur-sm border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
            Join the Waitlist
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Be among the first to experience AI-powered learning that adapts to your pace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                  required
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                disabled={isLoading || !email}
                className="h-12 px-8"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </div>
                ) : (
                  "Join Waitlist"
                )}
              </Button>
            </div>
          </form>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Early Access</h4>
              <p className="text-sm text-muted-foreground">
                Get first access to our AI-powered learning platform
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Exclusive Community</h4>
              <p className="text-sm text-muted-foreground">
                Join a community of forward-thinking learners
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Badge className="w-6 h-6 text-primary bg-transparent border-0 p-0">
                  <span className="text-xl">🎁</span>
                </Badge>
              </div>
              <h4 className="font-semibold">Special Pricing</h4>
              <p className="text-sm text-muted-foreground">
                Lock in exclusive early-bird pricing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid text-center">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">1,247</div>
          <div className="text-sm text-muted-foreground">Learners Waiting</div>
        </div>
      </div>
    </div>
  );
}
