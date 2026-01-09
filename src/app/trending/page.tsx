import TrendingClient from "./components/TrendingClient";
import { Navbar } from "~/components/Navbar";
import Footer from "~/components/Footer";
import { headers } from "next/headers";
import { createTRPCContext } from "~/server/api/trpc";
import { createCaller } from "~/server/api/root";

export default async function TrendingPage() {
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
      <Navbar user={null} />
      <TrendingClient user={null} initialData={initialData} />
      <Footer />
    </div>
  );
}
