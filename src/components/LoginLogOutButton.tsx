"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "~/utils/supabase/client";
import { signout } from "~/lib/auth-actions";
import type { User } from "@supabase/supabase-js";

const LoginButton = ({ user: initialUser }: { user?: User | null }) => {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser ?? null);
      if (initialUser) setLoading(false);
    }
  }, [initialUser]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    void fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
          setLoading(false);
          // Refresh the page to update server-side rendered content
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (loading) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (user) {
    return (
      <Button
        onClick={async () => {
             setLoading(true);
             await signout();
             setUser(null);
             router.refresh();
        }}
      >
        Log out
      </Button>
    );
  }
  
  return (
    <Button
      variant="outline"
      onClick={() => {
        router.push("/login");
      }}
    >
      Login
    </Button>
  );
};

export default LoginButton;