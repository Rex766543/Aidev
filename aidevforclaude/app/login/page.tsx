import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams

  async function signInWithGoogle(formData: FormData) {
    'use server'
    const nextPath = formData.get('next') as string
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin')

    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath || '/')}`,
      },
    })

    if (data.url) {
      redirect(data.url)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#09090b] flex items-center justify-center px-4 overflow-hidden">

      {/* Background orbs */}
      <div className="orb absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/20 pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="orb absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] bg-violet-600/15 pointer-events-none" style={{ animationDelay: '-4s' }} />
      <div className="orb absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-600/10 pointer-events-none" style={{ animationDelay: '-7s' }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa"/>
                  <stop offset="1" stopColor="#60a5fa"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">AIDev</h1>
          <p className="text-zinc-500 text-sm">AI開発を学ぶオンライン講座</p>
        </div>

        {/* Card */}
        <div className="glass border border-zinc-800 rounded-2xl p-8" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 64px -12px rgba(0,0,0,0.5)' }}>
          <h2 className="text-xl font-semibold text-white mb-1">ログイン</h2>
          <p className="text-zinc-500 text-sm mb-7">
            Googleアカウントで学習をはじめましょう
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              認証に失敗しました。もう一度お試しください。
            </div>
          )}

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next ?? '/'} />
            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-white/10 active:scale-[0.98]"
            >
              <GoogleIcon />
              <span>Googleでログイン</span>
            </button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-6">
            ログインすることで利用規約に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
