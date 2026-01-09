import { Navbar } from "~/components/Navbar";
import { InfiniteWordClones } from "~/components/InfiniteWordClones";
import Footer from "~/components/Footer";
import { Button } from "~/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />
      <div className="flex items-center justify-center py-8">
        <div className="w-full">
          <InfiniteWordClones text={"axionyt2810@gmail.com"} textClass={"text-2xl md:text-4xl"} />
        </div>
      </div>
      <div className="flex items-center justify-center py-6">
        <a
          href="https://getmechai.vercel.app/link.html?vpa=pranav23advani@okaxis&nm=Knowful&amt=20"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button>Support Development</Button>
        </a>
      </div>
      <Footer />
    </div>
  );
}
