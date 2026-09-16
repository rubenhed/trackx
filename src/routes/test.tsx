// src/routes/test.tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { useState, useEffect, useCallback } from "react";
import { auth } from "../lib/auth";
import { createTrackerServerFn } from "../server/trackers/server-fn";
import { runAgentServerFn } from "../server/agent/server-fn";

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
    const result = await auth.api.signUpEmail({
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Test User",
      },
      headers,
    });

    return {
      user: result.user,
      message: "Signed up + logged in as test user",
    };
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
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Trackx Test Page
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Test authentication and tracker creation flows.
          </p>
        </div>

        <div className="space-y-6">
          {/* Authentication */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Authentication</h2>
              <p className="text-sm text-gray-500">
                Test the session and authentication flow.
              </p>
            </div>

            {user ? (
              <div className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Logged in as
                  </div>
                  <div className="mt-1 text-sm font-medium">{user.email}</div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={busy}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={busy}
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Logging in..." : "Log in as test user"}
              </button>
            )}
          </section>

          {/* Tracker creation */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Create Tracker</h2>
              <p className="text-sm text-gray-500">
                Compare direct server function vs. agent creation.
              </p>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tracker name..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleDirectAdd}
                disabled={busy || !user || !name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Direct
              </button>

              <button
                onClick={handleAgentAdd}
                disabled={busy || !user || !name.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Via Agent
              </button>
            </div>

            {!user && (
              <p className="mt-3 text-xs text-amber-600">
                Log in first to create a tracker.
              </p>
            )}
          </section>

          {/* Log */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold">Log</h2>
                <p className="text-sm text-gray-500">
                  {log.length} {log.length === 1 ? "entry" : "entries"}
                </p>
              </div>

              {log.length > 0 && (
                <button
                  onClick={() => setLog([])}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="min-h-32 bg-gray-950 p-4">
              {log.length === 0 ? (
                <div className="font-mono text-xs text-gray-500">
                  No events yet...
                </div>
              ) : (
                <ul className="space-y-2">
                  {log.map((entry, i) => (
                    <li
                      key={i}
                      className="border-b border-gray-800 pb-2 font-mono text-xs leading-relaxed text-gray-300 last:border-0"
                    >
                      <span className="mr-2 text-gray-600">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {entry}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
