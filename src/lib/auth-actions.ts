"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "~/utils/supabase/server";
import { db } from "~/server/db";

async function createOrUpdateProfile(userId: string, email: string, fullName?: string, avatarUrl?: string) {
  try {
    await db.profile.upsert({
      where: { id: userId },
      update: {
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
      },
      create: {
        id: userId,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error creating/updating profile:", error);
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  // Create or update profile in database after successful login
  if (authData.user) {
    await createOrUpdateProfile(
      authData.user.id,
      authData.user.email!,
      authData.user.user_metadata?.full_name as string | undefined,
      authData.user.user_metadata?.avatar_url as string | undefined
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "page");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const firstName = formData.get("first-name") as string;
  const lastName = formData.get("last-name") as string;
  const email = formData.get("email") as string;
  const fullName = `${firstName} ${lastName}`;
  
  const data = {
    email,
    password: formData.get("password") as string,
    options: {
      data: {
        full_name: fullName,
        email,
      },
    },
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  // Create profile in database after successful signup
  if (authData.user) {
    await createOrUpdateProfile(
      authData.user.id,
      email,
      fullName
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "page");
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect("/logout");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect(data.url);
}