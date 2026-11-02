"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/actions/auth";
import type { FormState } from "@/lib/forms";
import { SubmitButton } from "./SubmitButton";
import { FormMessage } from "./ui";

export function AuthForm({ mode, next, notice }: { mode: "login" | "signup"; next: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? signIn : signUp, {});
  const isLogin = mode === "login";
  const v = state.values ?? {};

  return (
    <div className="card mx-auto w-full max-w-md p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-muted">
        {isLogin ? "Log in to upvote and follow milestones." : "Free for every rakyat. Politicians upgrade after signing up."}
      </p>
      {notice ? <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">{notice}</p> : null}

      <form action={action} className="mt-6 space-y-4">
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
