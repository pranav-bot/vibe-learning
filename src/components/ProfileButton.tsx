"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { createClient } from "~/utils/supabase/client";
import { User, User as UserIcon } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { signout } from "~/lib/auth-actions";

export function ProfileButton() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Also fetch profile for avatar/name
        // Note: For client side, we usually use RPC or just rely on metadata
        // For simplicity, we can use user_metadata if updated, or just simple data
        // But the profile update action updates user_metadata, so we can use that.
      }
    };
    fetchUser();
    
    // Listen for auth state changes to update avatar if changed (though simple refresh handles it too)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url || user.avatar_url;
  const fullName = user.user_metadata?.full_name || user.email;

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  return (
    <Link href="/profile">
      <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>
          {fullName ? getInitials(fullName) : <UserIcon className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
