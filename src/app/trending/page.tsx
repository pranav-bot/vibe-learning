import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import TrendingClient from "./components/TrendingClient";
import { Navbar } from "~/components/Navbar";

export default async function TrendingPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <TrendingClient user={user} />
    </div>
  );
}
