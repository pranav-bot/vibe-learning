"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { checkUsernameAvailability, updateUsername } from "~/lib/auth-actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader2, Check, X } from "lucide-react";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Get Started
    </Button>
  );
}

export function WelcomeForm() {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [minCharsReached, setMinCharsReached] = useState(false);

  useEffect(() => {
    // Reset state when username is empty or too short
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setMinCharsReached(false);
      return;
    }
    setMinCharsReached(true);

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const available = await checkUsernameAvailability(username);
        setIsAvailable(available);
      } catch (error) {
        console.error("Failed to check username", error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500); // Debounce check by 500ms

    return () => clearTimeout(timer);
  }, [username]);

  return (
    <form action={updateUsername} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            placeholder="johndoe"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={
              isAvailable === true
                ? "border-green-500 focus-visible:ring-green-500"
                : isAvailable === false
                ? "border-red-500 focus-visible:ring-red-500"
                : ""
            }
          />
          <div className="absolute right-3 top-2.5 h-4 w-4">
             {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
             {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-green-500" />}
             {!isChecking && isAvailable === false && <X className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {!isChecking && isAvailable === false && (
            <p className="text-sm text-red-500">Username is already taken</p>
        )}
        {!isChecking && isAvailable === true && (
            <p className="text-sm text-green-500">Username is available</p>
        )}
        {username.length > 0 && !minCharsReached && (
            <p className="text-sm text-muted-foreground">Must be at least 3 characters</p>
        )}
      </div>
      <SubmitButton disabled={isAvailable === false || username.length < 3 || isChecking} />
    </form>
  );
}
