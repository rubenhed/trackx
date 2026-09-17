// lib/server-auth.ts
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}