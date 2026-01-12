import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import { ProfileClient } from "./components/ProfileClient";
import { db } from "~/server/db";
import { Navbar } from "~/components/Navbar";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch profile from database
  let profile = await db.profile.findUnique({
    where: { id: user.id },
    include: {
      creditTransactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    profile = await db.profile.create({
      data: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
      },
      include: {
        creditTransactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <ProfileClient 
        user={user} 
        profile={profile}
      />
    </div>
  );
}
