import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '~/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to dashboard after successful OAuth
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // If there was an error, redirect to error page
    return NextResponse.redirect(new URL('/error', request.url))
  }

  // If no code parameter, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
