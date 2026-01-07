import GenerateClient from "./components/GenerateClient";
import { createClient } from "~/utils/supabase/server";
import { Navbar } from "~/components/Navbar";
import { redirect } from "next/navigation";

export default async function GeneratePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
    
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <GenerateClient />
    </div>
  );
}
