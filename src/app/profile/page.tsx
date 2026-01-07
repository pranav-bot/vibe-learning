import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import { ProfileClient } from "./components/ProfileClient";
import { db } from "~/server/db";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch profile from database
  const profile = await db.profile.findUnique({
    where: { id: user.id },
  });

  return (
    <div className="min-h-screen bg-background">
      <ProfileClient 
        user={user} 
        profile={profile}
      />
    </div>
  );
}
