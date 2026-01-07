import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import LoginButton from "~/components/LoginLogOutButton";
import ThemeToggle from "~/components/ThemeToggle";
import { DashboardClient } from "./components/DashboardClient";

export default async function Dashboard() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between px-6 py-8">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-foreground"></div>
          <Link href="/" className="text-2xl font-bold text-foreground">Vibe Learning</Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/library">Library</Link>
          </Button>
          <span className="text-muted-foreground">Welcome, {user.email}</span>
          <ThemeToggle />
          <LoginButton />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Dashboard</h1>
          <p className="text-xl text-muted-foreground">Upload your PDF documents to start learning</p>
        </div>

        {/* Upload PDF Section */}
        <div className="max-w-2xl mx-auto">
          <DashboardClient />
        </div>
      </div>
    </div>
  );
}
