import { createClient } from "~/utils/supabase/server";
import PublicProfileClient from "./components/PublicProfileClient";
import { Navbar } from "~/components/Navbar";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <PublicProfileClient userId={userId} user={user} />
    </div>
  );
}
