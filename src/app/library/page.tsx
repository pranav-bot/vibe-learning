import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import LibraryClient from "./components/LibraryClient";

export default async function LibraryPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <LibraryClient />
    </div>
  );
}
