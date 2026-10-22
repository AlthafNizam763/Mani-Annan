'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthModal() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setInfo('Password reset email sent! Check your inbox.');
      } else if (mode === 'signup') {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-neutral-950">

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-12 bg-neutral-950 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm select-none">
            <img
              src="/logo.png"
              alt="Mani-Annan Logo"
              className="w-10 h-10 rounded-full object-cover object-top border border-neutral-700 shadow-md bg-emerald-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Mani-Annan</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded font-mono tracking-wide">MVP</span>
            </div>
            <p className="text-neutral-500 text-xs mt-0.5">Authentic personal AI messaging assistant</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative space-y-7">
          <h1 className="text-[3.25rem] font-serif font-bold text-white leading-[1.15] tracking-tight">
            Your messages,{' '}
            <em className="text-emerald-400" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              in your own voice.
            </em>
          </h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed max-w-[380px]">
            Mani-Annan reads the conversation, learns how you talk, and drafts
            replies that sound like you. You stay in charge of what gets sent.
          </p>

          {/* Chat demo */}
          <div className="space-y-3 max-w-[340px]">
            <div className="bg-neutral-800 border border-neutral-700/60 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-neutral-200 w-fit shadow-sm">
              Are we still on for tomorrow evening?
            </div>
            <div className="bg-emerald-500 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-black font-medium ml-auto w-fit max-w-[260px] shadow-sm">
              Yes! Same place, same time. Bring the notes.
            </div>
            <p className="text-emerald-600/80 text-xs text-right pr-1 tracking-wide">✦ Drafted in your style</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center gap-2 text-neutral-600 text-xs">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          Secure personal messaging engine
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center p-8 border-l border-neutral-800/50">
        <div className="w-full max-w-[360px] space-y-7">

          {/* Sign In */}
          {mode === 'signin' && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h2>
                <p className="text-neutral-400 text-sm mt-1">Sign in to continue to your Mani-Annan workspace.</p>
              </div>

              {error && <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs leading-relaxed">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-600 transition-colors" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-neutral-400">Password</label>
                    <button type="button" onClick={() => switchMode('reset')} className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-600 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {loading ? 'Signing in…' : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-neutral-500">
                New to Mani-Annan?{' '}
                <button onClick={() => switchMode('signup')} className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">Create an account</button>
              </p>
            </>
          )}

          {/* Sign Up */}
          {mode === 'signup' && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">Create account</h2>
                <p className="text-neutral-400 text-sm mt-1">Set up your Mani-Annan owner account.</p>
              </div>

              {error && <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs leading-relaxed">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-600 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-600 transition-colors" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {loading ? 'Creating account…' : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-neutral-500">
                Already have an account?{' '}
                <button onClick={() => switchMode('signin')} className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">Sign in</button>
              </p>
            </>
          )}

          {/* Reset Password */}
          {mode === 'reset' && (
            <>
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">Reset password</h2>
                <p className="text-neutral-400 text-sm mt-1">Enter your email and we'll send a recovery link.</p>
              </div>

              {error && <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs leading-relaxed">{error}</div>}
              {info && <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs leading-relaxed">{info}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-600 transition-colors" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {loading ? 'Sending…' : <><span>Send reset link</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-neutral-500">
                <button onClick={() => switchMode('signin')} className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">← Back to sign in</button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
