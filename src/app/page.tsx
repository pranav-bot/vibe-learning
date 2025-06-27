import { HydrateClient } from "~/trpc/server";
import { LearningCurveGenerator } from "~/components/LearningCurveGenerator";
import SplitPanelWrapper from "~/components/SplitPanelWrapper";
import WaitlistForm from "~/components/WaitlistForm";


export default async function Home() {

  return (
    <HydrateClient>
      <div className="min-h-screen bg-background">
        {/* Split Panel Transition Wrapper */}
        <SplitPanelWrapper />

        {/* Scroll trigger area to enable scroll-based animation */}
        <div className="h-[30vh]"></div>

        {/* Learning Curve Display Section - Now in normal document flow */}
        <section className="learning-curve-section w-full min-h-screen bg-background relative z-10 flex items-center justify-center">
          <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                AI-Powered Learning Curve Visualization
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience how our AI structures learning journeys for maximum impact and efficiency. Enter any topic to see how learning progresses over time.
              </p>
            </div>
            
            <LearningCurveGenerator />
          </div>
        </section>

        {/* Waitlist Section */}
        <section className="w-full min-h-screen bg-muted/30 flex items-center justify-center">
          <div className="container mx-auto px-6 py-16">
            <WaitlistForm />
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="w-full min-h-screen bg-background flex items-center justify-center">
          <div className="container mx-auto px-6 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              Revolutionary Learning Experience
            </h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-lg text-muted-foreground">
                Knowful transforms how you learn by creating personalized learning curves that adapt to your pace and style. 
                Our AI analyzes your progress and optimizes the learning path for maximum retention and understanding.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <h3 className="text-xl font-semibold">AI-Powered</h3>
                  <p className="text-muted-foreground">
                    Advanced AI algorithms create personalized learning experiences
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold">Adaptive Learning</h3>
                  <p className="text-muted-foreground">
                    Curriculum that evolves based on your progress and preferences
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-semibold">Accelerated Results</h3>
                  <p className="text-muted-foreground">
                    Learn faster and retain more with our optimized approach
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HydrateClient>
  );
}
