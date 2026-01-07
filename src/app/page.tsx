import Link from "next/link";

import { HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import LoginButton from "~/components/LoginLogOutButton";
import ThemeToggle from "~/components/ThemeToggle";
import { createClient } from "~/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(process.env.NEXT_PUBLIC_BACKEND_URL);

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="container mx-auto flex items-center justify-between px-6 py-8">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-foreground"></div>
            <span className="text-2xl font-bold text-foreground">Vibe Learning</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                <ThemeToggle />
                <LoginButton />
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground">Welcome, {user.email}</span>
                <Button variant="ghost" asChild>
                  <Link href="/library">Roadmap Learning</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Single Document</Link>
                </Button>
                <ThemeToggle />
                <LoginButton />
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-extrabold text-foreground mb-8 leading-tight">
              Learn at the Speed of
              <span className="text-muted-foreground"> Thought</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              Choose your learning approach: Build comprehensive roadmaps or analyze single documents with AI
            </p>
            
            {/* Learning Options */}
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
              <Card className="p-8 hover:shadow-lg transition-all border-2 hover:border-primary cursor-pointer group">
                <Link href="/library" className="block">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Roadmap Learning</h3>
                    <p className="text-muted-foreground">
                      Create comprehensive learning roadmaps for any topic with AI-generated content and structured progression
                    </p>
                  </div>
                </Link>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-all border-2 hover:border-primary cursor-pointer group">
                <Link href="/dashboard" className="block">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Single Document</h3>
                    <p className="text-muted-foreground">
                      Upload and analyze individual documents, PDFs, or content with AI-powered insights and explanations
                    </p>
                  </div>
                </Link>
              </Card>
            </div>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">Start Learning Free</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-foreground"></div>
                  <span className="text-xl font-bold text-foreground">Vibe Learning</span>
                </div>
                <p className="text-muted-foreground">
                  Empowering learners worldwide with AI-driven education.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Product</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link href="/library" className="hover:text-foreground transition-colors">Roadmap Learning</Link></li>
                  <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Single Document</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Company</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                  <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Support</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                  <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
              <p>&copy; 2025 Vibe Learning. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </HydrateClient>
  );
}
