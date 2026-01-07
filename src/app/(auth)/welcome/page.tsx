import { updateUsername } from "~/lib/auth-actions"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

export default function WelcomePage() {
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
          <form action={updateUsername} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="johndoe"
                required
                minLength={3}
              />
            </div>
            <Button type="submit" className="w-full">
              Get Started
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
