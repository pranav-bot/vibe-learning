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
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "~/components/ui/sheet";

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
          <img src="/download.svg" alt="Vibe Learning Logo" className="h-8 w-8 rounded-lg" />
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

      {/* Mobile Menu */}
      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="flex flex-col space-y-4 mt-8">
                    {!user ? (
                        <>
                            <div className="flex flex-col gap-2">
                                <Button className="w-full" asChild>
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button className="w-full" asChild>
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            <Button variant="ghost" className="justify-start" asChild>
                                <Link href="/generate">Create</Link>
                            </Button>
                            <Button variant="ghost" className="justify-start" asChild>
                                <Link href="/trending">Trending</Link>
                            </Button>
                            <Button variant="ghost" className="justify-start" asChild>
                                <Link href="/library">My Roadmaps</Link>
                            </Button>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <span className="text-sm font-medium">Profile</span>
                                <ProfileButton />
                            </div>
                            <div className="pt-2">
                                <LoginButton user={user} />
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
