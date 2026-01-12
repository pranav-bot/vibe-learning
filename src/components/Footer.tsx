import Link from "next/link";
import ScrollReveal from "~/components/ScrollReveal";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/download.svg" alt="Vibe Learning Logo" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold text-foreground">Knowful</span>
            </div>
            <p className="text-muted-foreground">
              Empowering learners worldwide with AI-driven education.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/library" className="hover:text-foreground transition-colors">
                  Roadmap Learning
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-foreground transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">About</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="hidden md:flex items-center justify-end">
            <div className="w-48">
              <ScrollReveal compact />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
