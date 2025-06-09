import Link from "next/link";

import { HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import LoginButton from "~/components/LoginLogOutButton";
import { createClient } from "~/utils/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Navigation */}
        <nav className="container mx-auto flex items-center justify-between px-6 py-8">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-2xl font-bold text-white">Vibe Learning</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
                <LoginButton />
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user.email}</span>
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <LoginButton />
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-8 leading-tight">
              Learn at the Speed of
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Thought</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              Experience the future of education with AI-powered personalized learning. 
              Adaptive content, intelligent tutoring, and real-time progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Button size="lg" asChild>
                    <Link href="/signup">Start Learning Free</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="#demo">Watch Demo</Link>
                  </Button>
                </>
              ) : (
                <Button size="lg" asChild>
                  <Link href="/dashboard">Continue Your Learning Journey</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our cutting-edge technology adapts to your learning style and pace
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <CardTitle className="text-white">AI Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Get personalized explanations and instant help from your AI learning companion, available 24/7.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-2">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <CardTitle className="text-white">Adaptive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Our AI analyzes your progress and adjusts difficulty levels to optimize your learning curve.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-2">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 712 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <CardTitle className="text-white">Progress Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Track your learning journey with detailed insights and performance metrics.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-white mb-2">50K+</div>
                  <div className="text-gray-300">Active Learners</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-gray-300">Success Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">1M+</div>
                  <div className="text-gray-300">Lessons Completed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-gray-300">AI Support</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your Learning Path
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start free and upgrade as you grow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Starter</CardTitle>
                <div className="text-4xl font-bold text-white">Free</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-gray-300">✓ 5 lessons per month</div>
                <div className="text-gray-300">✓ Basic AI tutor</div>
                <div className="text-gray-300">✓ Progress tracking</div>
                <div className="text-gray-300">✓ Community access</div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-gradient-to-b from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-purple-500/50 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-white">Pro</CardTitle>
                <div className="text-4xl font-bold text-white">$19<span className="text-lg">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-gray-300">✓ Unlimited lessons</div>
                <div className="text-gray-300">✓ Advanced AI tutor</div>
                <div className="text-gray-300">✓ Detailed analytics</div>
                <div className="text-gray-300">✓ Priority support</div>
                <div className="text-gray-300">✓ Custom learning paths</div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-white">Custom</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-gray-300">✓ Everything in Pro</div>
                <div className="text-gray-300">✓ Team management</div>
                <div className="text-gray-300">✓ Custom integrations</div>
                <div className="text-gray-300">✓ Dedicated support</div>
                <div className="text-gray-300">✓ Advanced security</div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {!user 
                ? "Ready to Transform Your Learning?"
                : "Ready to Continue Learning?"
              }
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              {!user 
                ? "Join thousands of learners who are already experiencing the future of education."
                : "Continue your personalized learning journey and unlock your potential."
              }
            </p>
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105" asChild>
              <Link href={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Start Your Journey Today"}
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <span className="text-xl font-bold text-white">Vibe Learning</span>
                </div>
                <p className="text-gray-400">
                  Empowering learners worldwide with AI-driven education.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Vibe Learning. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </HydrateClient>
  );
}
