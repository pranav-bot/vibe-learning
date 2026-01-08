"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import LoginButton from "~/components/LoginLogOutButton";
import ThemeToggle from "~/components/ThemeToggle";
import { ProfileButton } from "~/components/ProfileButton";
import { type User } from "@supabase/supabase-js";
import { createClient } from "~/utils/supabase/client";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: User | null;
}

export const Navbar = ({ user: initialUser }: NavbarProps) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Sync state with prop if it changes (e.g. after server revalidation)
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
         router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <nav className="container mx-auto flex items-center justify-between px-6 py-8">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-foreground"></div>
          <span className="text-2xl font-bold text-foreground">Vibe Learning</span>
        </Link>
      </div>
      <div className="hidden md:flex items-center space-x-8">
        {!user ? (
          <>
            <ThemeToggle />
            <LoginButton user={user} />
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/generate">Create</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/trending">Trending</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/library">My Roadmaps</Link>
            </Button>
            <ThemeToggle />
            <ProfileButton />
            <LoginButton user={user} />
          </div>
        )}
      </div>
    </nav>
  );
};
