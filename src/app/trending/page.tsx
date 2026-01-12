import TrendingClient from "./components/TrendingClient";
import { Navbar } from "~/components/Navbar";
import Footer from "~/components/Footer";
import { headers } from "next/headers";
import { createTRPCContext } from "~/server/api/trpc";
import { createCaller } from "~/server/api/root";
import { createClient } from "~/utils/supabase/server";

export default async function TrendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Create a server-side tRPC caller with request headers so we can fetch trending roadmaps
  // and pass them as initial data to the client component.
  let initialData = undefined;

  try {
    const heads = new Headers(await headers());
    heads.set("x-trpc-source", "rsc");
    const ctx = await createTRPCContext({ headers: heads });
    const trpc = createCaller(() => ctx);
    const res = await trpc.roadmap.getTrending({ limit: 20 });
    initialData = res;
  } catch (err) {
    console.error("Failed to fetch trending data on server:", err);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <TrendingClient user={user} initialData={initialData} />
      <Footer />
    </div>
  );
}
