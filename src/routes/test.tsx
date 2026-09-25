// src/routes/test.tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { useCallback, useEffect, useState } from "react";
import { auth } from "../lib/auth";
import {
  createEntryServerFn,
  createTrackerServerFn,
} from "../server/trackers/server-fn";
import { runAgentServerFn } from "../server/agent/server-fn";

const TEST_EMAIL = "test@trackx.dev";
const TEST_PASSWORD = "test-password-123";

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

export const Route = createFileRoute("/test")({
  component: TestPage,
});

type LastTracker = {
  id: string;
  name: string;
  fields: { id: string; name: string }[];
};

function TestPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const [trackerName, setTrackerName] = useState("My Tracker");
  const [fieldsInput, setFieldsInput] = useState("mood, energy");
  const [lastTracker, setLastTracker] = useState<LastTracker | null>(null);

  const [entryTrackerId, setEntryTrackerId] = useState("");
  const [entryFieldId, setEntryFieldId] = useState("");
  const [entryValue, setEntryValue] = useState("good");

  const [agentMessage, setAgentMessage] = useState("");

  const append = (msg: string) => setLog((l) => [...l, msg]);
  const errMsg = (err: unknown) =>
    err instanceof Error ? err.message : String(err);

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
      append(`Login failed: ${errMsg(err)}`);
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

  function parseFieldNames(): string[] {
    return fieldsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleDirectTracker() {
    if (!trackerName.trim()) return;
    setBusy(true);
    try {
      const fieldNames = parseFieldNames();
      const result = await createTrackerServerFn({
        data: { name: trackerName.trim(), fields: fieldNames },
      });
      setLastTracker({
        id: result.tracker.id,
        name: result.tracker.name,
        fields: result.fields.map((f) => ({ id: f.id, name: f.name })),
      });
      setEntryTrackerId(String(result.tracker.id));
      if (result.fields[0]) setEntryFieldId(String(result.fields[0].id));
      append(
        `Direct tracker: "${result.tracker.name}" (id ${result.tracker.id}) with ${result.fields.length} fields`,
      );
    } catch (err) {
      append(`Direct tracker failed: ${errMsg(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleAgentTracker() {
    if (!trackerName.trim()) return;
    setBusy(true);
    try {
      const fieldNames = parseFieldNames();
      const reply = await runAgentServerFn({
        data: {
          message: `Create a tracker called "${trackerName.trim()}"${
            fieldNames.length ? ` with fields: ${fieldNames.join(", ")}` : ""
          }`,
        },
      });
      append(`Agent tracker: ${reply}`);
    } catch (err) {
      append(`Agent tracker failed: ${errMsg(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDirectEntry() {
    const trackerId = entryTrackerId.trim();
    const fieldId = entryFieldId.trim();
    if (!trackerId || !fieldId || !entryValue.trim()) return;
    setBusy(true);
    try {
      const result = await createEntryServerFn({
        data: {
          trackerId,
          loggedAt: new Date().toISOString(),
          values: [{ fieldId, value: entryValue.trim() }],
        },
      });
      append(
        `Direct entry: id ${result.entry.id} for tracker ${trackerId} (${result.values.length} values)`,
      );
    } catch (err) {
      append(`Direct entry failed: ${errMsg(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleAgentEntry() {
    const trackerId = entryTrackerId.trim();
    const fieldId = entryFieldId.trim();
    if (!trackerId || !entryValue.trim()) return;
    setBusy(true);
    try {
      const reply = await runAgentServerFn({
        data: {
          message: `Log an entry for tracker ${trackerId} with field ${fieldId} = "${entryValue.trim()}"`,
        },
      });
      append(`Agent entry: ${reply}`);
    } catch (err) {
      append(`Agent entry failed: ${errMsg(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleAgentSend() {
    if (!agentMessage.trim()) return;
    setBusy(true);
    try {
      const reply = await runAgentServerFn({
        data: { message: agentMessage.trim() },
      });
      append(`Agent: ${reply}`);
      setAgentMessage("");
    } catch (err) {
      append(`Agent failed: ${errMsg(err)}`);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200";
  const btnPrimary =
    "rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40";
  const btnAgent =
    "rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40";
  const btnGhost =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Trackx Test Page
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Auth + trackers + entries, direct vs agent.
          </p>
        </div>

        <div className="space-y-6">
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
                  className={btnGhost}
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
                {busy ? "Working..." : "Log in as test user"}
              </button>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Create Tracker</h2>
              <p className="text-sm text-gray-500">
                Compare direct server function vs. agent creation.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Tracker name
                </label>
                <input
                  value={trackerName}
                  onChange={(e) => setTrackerName(e.target.value)}
                  placeholder="e.g. Mood, Workout..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Fields <span className="font-normal text-gray-400">(comma separated)</span>
                </label>
                <input
                  value={fieldsInput}
                  onChange={(e) => setFieldsInput(e.target.value)}
                  placeholder="mood, energy"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleDirectTracker}
                disabled={busy || !user || !trackerName.trim()}
                className={btnPrimary}
              >
                Direct
              </button>
              <button
                onClick={handleAgentTracker}
                disabled={busy || !user || !trackerName.trim()}
                className={btnAgent}
              >
                Via agent
              </button>
            </div>

            {lastTracker ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                <div className="font-medium text-emerald-900">
                  {lastTracker.name}{" "}
                  <span className="font-normal text-emerald-700">
                    (id {lastTracker.id})
                  </span>
                </div>
                <div className="mt-1 text-xs text-emerald-800">
                  {lastTracker.fields.length
                    ? lastTracker.fields
                        .map((f) => `${f.name} (${f.id})`)
                        .join(", ")
                    : "No fields"}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-400">
                {user ? "No tracker created yet." : "Log in first to create a tracker."}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Log Entry</h2>
              <p className="text-sm text-gray-500">
                Write a value to a tracker field. Ids auto-fill from the last
                created tracker.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Tracker id
                </label>
                <input
                  value={entryTrackerId}
                  onChange={(e) => setEntryTrackerId(e.target.value)}
                  placeholder="tracker UUID"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Field id
                </label>
                <input
                  value={entryFieldId}
                  onChange={(e) => setEntryFieldId(e.target.value)}
                  placeholder="field UUID"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Value
              </label>
              <input
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                placeholder="good"
                className={inputCls}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleDirectEntry}
                disabled={busy || !user || !entryTrackerId || !entryFieldId}
                className={btnPrimary}
              >
                Direct
              </button>
              <button
                onClick={handleAgentEntry}
                disabled={busy || !user || !entryTrackerId}
                className={btnAgent}
              >
                Via agent
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Agent</h2>
              <p className="text-sm text-gray-500">
                Send a freeform message to the TrackX assistant.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={agentMessage}
                onChange={(e) => setAgentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAgentSend();
                }}
                placeholder="Ask the agent anything..."
                className={inputCls}
              />
              <button
                onClick={handleAgentSend}
                disabled={busy || !user || !agentMessage.trim()}
                className="shrink-0 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
