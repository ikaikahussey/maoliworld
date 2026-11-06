"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
}

export default function GroupsManager({ groups }: { groups: GroupRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = async (key: string, url: string, init: RequestInit) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await request("create", "/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (ok) {
      setName("");
      setDescription("");
    }
  };

  const mine = groups.filter((g) => g.isMember);
  const others = groups.filter((g) => !g.isMember);

  const row = (g: GroupRow) => (
    <li
      key={g.id}
      className="flex items-center justify-between gap-4 bg-white p-4"
    >
      <div>
        <p className="font-medium text-gray-900">{g.name}</p>
        {g.description && (
          <p className="text-sm text-gray-600">{g.description}</p>
        )}
        <p className="text-xs text-gray-500">
          {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
        </p>
      </div>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          request(g.id, `/api/groups/${g.id}/membership`, {
            method: g.isMember ? "DELETE" : "POST",
          })
        }
        className={g.isMember ? "btn-secondary" : "btn-primary"}
      >
        {busy === g.id ? "..." : g.isMember ? "Leave" : "Join"}
      </button>
    </li>
  );

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <section>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Your groups
        </h2>
        {mine.length === 0 ? (
          <p className="text-sm text-gray-500">
            You are not a member of any group.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg shadow-sm">
            {mine.map(row)}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Other groups
        </h2>
        {others.length === 0 ? (
          <p className="text-sm text-gray-500">No other groups.</p>
        ) : (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg shadow-sm">
            {others.map(row)}
          </ul>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Create a group
        </h2>
        <form onSubmit={createGroup} className="space-y-4">
          <div>
            <label htmlFor="group-name" className="form-label">
              Name
            </label>
            <input
              id="group-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="group-description" className="form-label">
              Description
            </label>
            <input
              id="group-description"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy !== null || !name.trim()}
              className="btn-primary"
            >
              {busy === "create" ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
