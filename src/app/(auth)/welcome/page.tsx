import { createClient } from "~/utils/supabase/server"
import { db } from "~/server/db"
import { redirect } from "next/navigation"
import { WelcomeForm } from "./welcome-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await db.profile.findUnique({
      where: { id: user.id }
  })

  // If username is set, welcome page is not accessible
  if (profile?.username) {
      redirect("/library")
  }

  return (
    <div className="flex h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            Please choose a username to continue to the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WelcomeForm />
        </CardContent>
      </Card>
    </div>
  )
}
