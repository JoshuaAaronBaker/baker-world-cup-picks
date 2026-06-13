"use client";

import { useActionState } from "react";
import { logIn, signUp } from "@/app/auth/actions";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? logIn : signUp;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form className="auth-form" action={formAction}>
      <label>
        Username
        <input
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9_-]{3,24}"
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "login" ? undefined : 8}
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Working..." : mode === "login" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}
