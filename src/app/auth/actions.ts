"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, clearSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeUsername, validateUsername } from "@/lib/username";

type AuthState = {
  error?: string;
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const username = getFormValue(formData, "username").trim();
  const password = getFormValue(formData, "password");
  const usernameError = validateUsername(username);

  if (usernameError) {
    return { error: usernameError };
  }

  if (password.length < 8) {
    return { error: "Use at least 8 characters for the password." };
  }

  const normalizedUsername = normalizeUsername(username);
  const existingUser = await prisma.user.findUnique({
    where: { normalizedUsername },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      normalizedUsername,
      passwordHash,
    },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/predictions");
}

export async function logIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const username = getFormValue(formData, "username");
  const password = getFormValue(formData, "password");
  const normalizedUsername = normalizeUsername(username);
  const user = await prisma.user.findUnique({
    where: { normalizedUsername },
    select: { id: true, passwordHash: true, disabled: true },
  });

  if (!user || user.disabled) {
    return { error: "Invalid username or password." };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    return { error: "Invalid username or password." };
  }

  await createSession(user.id);
  redirect("/predictions");
}

export async function logOut() {
  await clearSession();
  redirect("/");
}
