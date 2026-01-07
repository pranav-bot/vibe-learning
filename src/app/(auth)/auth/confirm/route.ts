import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '~/utils/supabase/server'
import { db } from '~/server/db'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('code')
  redirectTo.searchParams.delete('next')

  const supabase = await createClient()

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create or update profile after successful OAuth login
      await createOrUpdateProfile(
        data.user.id,
        data.user.email!,
        data.user.user_metadata?.full_name as string | undefined,
        data.user.user_metadata?.avatar_url as string | undefined
      );
      
      return NextResponse.redirect(redirectTo)
    }
  }

  // Handle email verification
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error && data.user) {
      // Create or update profile after successful email verification
      await createOrUpdateProfile(
        data.user.id,
        data.user.email!,
        data.user.user_metadata?.full_name as string | undefined,
        data.user.user_metadata?.avatar_url as string | undefined
      );
      
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}