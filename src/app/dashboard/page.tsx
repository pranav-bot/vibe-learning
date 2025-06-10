import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import Link from "next/link";
import LoginButton from "~/components/LoginLogOutButton";
import { DashboardClient } from "./components/DashboardClient";

export default async function Dashboard() {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between px-6 py-8">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <Link href="/" className="text-2xl font-bold text-white">Vibe Learning</Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {user.email}</span>
          <LoginButton />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-xl text-gray-300">Upload your PDF documents to start learning</p>
        </div>

        {/* Upload PDF Section */}
        <div className="max-w-2xl mx-auto">
          <DashboardClient />
        </div>
      </div>
    </div>
  );
}
