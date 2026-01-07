import { redirect } from "next/navigation";
import { createClient } from "~/utils/supabase/server";
import { LearningClient } from "./components/LearningClient";

interface PageProps {
  params: Promise<{
    contentId: string;
  }>;
}

export default async function LearnPage({ params }: PageProps) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { contentId } = await params;

  return (
    <div className="min-h-screen bg-background">
      <LearningClient contentId={contentId} />
    </div>
  );
}
