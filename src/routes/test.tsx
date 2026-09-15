// src/routes/test.tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { useState, useEffect, useCallback } from "react";
import { auth } from "../lib/auth";
import { createTrackerServerFn } from "../server/trackers/server-fn";
import { runAgentServerFn } from "../server/agent/server-fn"; // adjust to wherever runAgentServerFn lives

const TEST_EMAIL = "test@trackx.dev";
const TEST_PASSWORD = "test-password-123";

// --- server fns using your auth instance directly ---

const getSessionServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    return session?.user ?? null;
  },
);

const loginServerFn = createServerFn({ method: "POST" }).handler(async () => {
  const headers = getRequestHeaders();
  try {
    const result = await auth.api.signInEmail({
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      headers,
    });
    return { user: result.user, message: "Logged in as test user" };
  } catch {
    // test user doesn't exist yet — create it
    const result = await auth.api.signUpEmail({
      body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: "Test User" },
      headers,
    });
    return { user: result.user, message: "Signed up + logged in as test user" };
  }
});

const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  await auth.api.signOut({ headers: getRequestHeaders() });
  return null;
});

// --- route ---

export const Route = createFileRoute("/test")({
  component: TestPage,
});

function TestPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [name, setName] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const append = (msg: string) => setLog((l) => [...l, msg]);

  const refreshSession = useCallback(async () => {
    const sessionUser = await getSessionServerFn();
    setUser(sessionUser);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  async function handleLogin() {
    setBusy(true);
    try {
      const { user, message } = await loginServerFn();
      setUser(user);
      append(message);
    } catch (err) {
      append(
        `Login failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await logoutServerFn();
      setUser(null);
      append("Logged out");
    } finally {
      setBusy(false);
    }
  }

  async function handleDirectAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const tracker = await createTrackerServerFn({ data: { name } });
      append(`Direct: created tracker "${tracker.name}" (id ${tracker.id})`);
    } catch (err) {
      append(
        `Direct add failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAgentAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const reply = await runAgentServerFn({
        data: { message: `Create a tracker called "${name}"` },
      });
      append(`Agent: ${reply}`);
    } catch (err) {
      append(
        `Agent add failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480 }}>
      <h2>Trackx test page</h2>

      <section style={{ marginBottom: 16 }}>
        {user ? (
          <>
            <p>Logged in as {user.email}</p>
            <button onClick={handleLogout} disabled={busy}>
              Log out
            </button>
          </>
        ) : (
          <button onClick={handleLogin} disabled={busy}>
            Log in as test user
          </button>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tracker name"
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={handleDirectAdd} disabled={busy || !user}>
            Add via createTrackerServerFn
          </button>{" "}
          <button onClick={handleAgentAdd} disabled={busy || !user}>
            Add via agent
          </button>
        </div>
      </section>

      <section>
        <h4>Log</h4>
        <ul>
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
