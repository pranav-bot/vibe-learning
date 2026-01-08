import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '~/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${request.nextUrl.origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${request.nextUrl.origin}${next}`);
      }
    }
  }

  // If no code parameter or error, redirect to error page
  // return NextResponse.redirect(new URL('/error', request.url))
  // For now just redirect to login if something fails
  return NextResponse.redirect(new URL('/login', request.url))
}
