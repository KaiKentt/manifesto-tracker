"use client";

import Link from "@/components/NavigationLink";
import { useActionState } from "react";
import { signIn, signUp, signInWithGoogle } from "@/actions/auth";
import type { FormState } from "@/lib/forms";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./ui";

export function AuthForm({ mode, next, notice }: { mode: "login" | "signup"; next: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? signIn : signUp, {});
  const [googleState, googleAction] = useActionState<FormState, FormData>(signInWithGoogle, {});
  const isLogin = mode === "login";
  const v = state.values ?? {};

  return (
    <div className="card mx-auto w-full max-w-md p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-muted">
        {isLogin ? "Log in to upvote and follow milestones." : "Free for every rakyat. Politicians upgrade after signing up."}
      </p>
      {notice ? <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">{notice}</p> : null}

      <form action={googleAction} className="mt-6 space-y-3">
        <input type="hidden" name="next" value={next} />
        <SubmitButton className="btn-ghost w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" pendingText="Connecting to Google…">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.91a6 6 0 0 1 0-3.82V7.5H3.06a10 10 0 0 0 0 9l3.34-2.59Z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z" />
          </svg>
          Continue with Google
        </SubmitButton>
        <FormMessage state={googleState} />
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        <span>or continue with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {!isLogin ? (
          <div>
            <label htmlFor="display_name" className="label">Display name</label>
            <input id="display_name" name="display_name" defaultValue={v.display_name} className="input" autoComplete="nickname" placeholder="How others see you" />
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required defaultValue={v.email} className="input" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            className="input"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full" pendingText={isLogin ? "Logging in…" : "Creating account…"}>
          {isLogin ? "Log in" : "Sign up"}
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={`/${isLogin ? "signup" : "login"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
