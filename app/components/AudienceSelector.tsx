"use client";

import Link from "next/link";

export type Visibility = "PUBLIC" | "GROUPS";

export interface GroupOption {
  id: string;
  name: string;
}

interface AudienceSelectorProps {
  groups: GroupOption[];
  visibility: Visibility;
  selectedGroupIds: string[];
  onVisibilityChange: (v: Visibility) => void;
  onSelectedGroupIdsChange: (ids: string[]) => void;
}

export default function AudienceSelector({
  groups,
  visibility,
  selectedGroupIds,
  onVisibilityChange,
  onSelectedGroupIdsChange,
}: AudienceSelectorProps) {
  const hasGroups = groups.length > 0;

  const toggleGroup = (id: string) => {
    onSelectedGroupIdsChange(
      selectedGroupIds.includes(id)
        ? selectedGroupIds.filter((g) => g !== id)
        : [...selectedGroupIds, id]
    );
  };

  const optionClass = (active: boolean, disabled = false) =>
    `flex items-start gap-3 rounded-md border p-3 ${
      disabled
        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
        : active
        ? "cursor-pointer border-indigo-500 bg-indigo-50"
        : "cursor-pointer border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700">
        Who can see this post?
      </legend>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className={optionClass(visibility === "PUBLIC")}>
          <input
            type="radio"
            name="visibility"
            value="PUBLIC"
            checked={visibility === "PUBLIC"}
            onChange={() => onVisibilityChange("PUBLIC")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">
              All users
            </span>
            <span className="block text-xs text-gray-500">
              Everyone on Maoli World can see it.
            </span>
          </span>
        </label>

        <label className={optionClass(visibility === "GROUPS", !hasGroups)}>
          <input
            type="radio"
            name="visibility"
            value="GROUPS"
            checked={visibility === "GROUPS"}
            disabled={!hasGroups}
            onChange={() => onVisibilityChange("GROUPS")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">
              My groups
            </span>
            <span className="block text-xs text-gray-500">
              {hasGroups
                ? "Only members of the groups you select can see it."
                : "You are not in any groups yet."}
            </span>
          </span>
        </label>
      </div>

      {!hasGroups && (
        <p className="mt-2 text-xs text-gray-500">
          <Link href="/groups" className="text-indigo-600 hover:underline">
            Join or create a group
          </Link>{" "}
          to post to a smaller audience.
        </p>
      )}

      {visibility === "GROUPS" && hasGroups && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Share with:</span>
            <div className="space-x-3 text-xs">
              <button
                type="button"
                onClick={() => onSelectedGroupIdsChange(groups.map((g) => g.id))}
                className="text-indigo-600 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => onSelectedGroupIdsChange([])}
                className="text-indigo-600 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.map((group) => {
              const checked = selectedGroupIds.includes(group.id);
              return (
                <label
                  key={group.id}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    checked
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleGroup(group.id)}
                  />
                  {group.name}
                </label>
              );
            })}
          </div>
          {selectedGroupIds.length === 0 && (
            <p className="mt-2 text-xs text-red-600">
              Select at least one group.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
