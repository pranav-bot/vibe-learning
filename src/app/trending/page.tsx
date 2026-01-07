import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import TrendingClient from "./components/TrendingClient";

export default async function TrendingPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <TrendingClient user={user} />
    </div>
  );
}
