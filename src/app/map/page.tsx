import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import MapClient from "./components/MapClient";

export default async function MapPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <MapClient />
    </div>
  );
}
