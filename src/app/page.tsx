import Link from "next/link";
import SplitPanelWrapper from "~/components/SplitPanelWrapper";
import FeatureShowcase from "~/components/FeatureShowcase";
import { HydrateClient } from "~/trpc/server";
import { Card } from "~/components/ui/card";
import { createClient } from "~/utils/supabase/server";
import { Navbar } from "~/components/Navbar";
import { InfiniteWordClones } from "~/components/InfiniteWordClones";
import ScrollRevealText from "~/components/ScrollReveal";
import Footer from "~/components/Footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // console.log(process.env.NEXT_PUBLIC_BACKEND_URL);

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background">
        {/* Split Panel Transition Wrapper */}
        <SplitPanelWrapper />

        {/* Scroll trigger area to enable scroll-based animation */}
        <div id="intro-spacer" className="h-[100vh]"></div>

        <div id="landing-content" className="relative z-10 bg-background">
        {/* Navigation */}
        <Navbar user={user} />

        

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-10">
          <div className="mb-8 w-full">
            <InfiniteWordClones />
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side: Scroll Reveal */}
            <div className="w-full">
              <ScrollRevealText />
            </div>

            {/* Right Side: Text Content */}
            <div className="space-y-6 text-left">
              <p className="text-2xl font-semibold text-foreground">
                Almost everything you need to skill up already exists—for free.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Knowful crowdsources the best YouTube videos and online resources into well-structured roadmaps, so you always know what to learn next.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                You can learn almost anything for free, but gathering the right resources is time-consuming and often stops progress—Knowful curates the roadmap and finds the best free content for you.
              </p>

              {/* Learning Options */}
              <div className="pt-4">
                <Card className="p-8 hover:shadow-lg transition-all border-2 hover:border-primary cursor-pointer group w-full">
                  <Link href="/generate" className="block">
                    <div className="text-center space-y-4">
                      <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Generate Roadmap</h3>
                        <p className="text-muted-foreground">Create a custom learning path from any topic</p>
                      </div>
                    </div>
                  </Link>
                </Card>
              
                <Card className="p-8 hover:shadow-lg transition-all border-2 hover:border-primary cursor-pointer group w-full mt-4">
                  <Link href="/trending" className="block">
                    <div className="text-center space-y-4">
                      <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Trending Roadmaps</h3>
                        <p className="text-muted-foreground">Browse public roadmaps shared by the community</p>
                      </div>
                    </div>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase Section */}
        <FeatureShowcase />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </HydrateClient>
  );
}
