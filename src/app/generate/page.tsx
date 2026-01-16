import GenerateClient from "./components/GenerateClient";
import { createClient } from "~/utils/supabase/server";
import { Navbar } from "~/components/Navbar";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { redirect } from "next/navigation";
import Footer from "~/components/Footer";
import { db } from "~/server/db";

export default async function GeneratePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await db.profile.findUnique({
    where: { id: user.id },
  });
    
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      {/* <div className="container mx-auto px-6 py-6 flex justify-end">
        <Link href="/trending">
          <Button>Trending Roadmaps</Button>
        </Link>
      </div> */}
      <GenerateClient user={user} credits={profile?.credits ?? 0} />
      <Footer />
    </div>
  );
}
