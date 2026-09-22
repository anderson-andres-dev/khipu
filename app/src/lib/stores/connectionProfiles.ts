import { browser } from "$app/environment";
import { writable } from "svelte/store";
import type { ConnectionDriver } from "$lib/connections";
import type { PasswordPolicy } from "$lib/credentials";

const STORAGE_KEY = "khipu:connection-profiles";

export interface ConnectionProfile {
  id: string;
  name: string;
  driver: ConnectionDriver;
  host: string;
  port: number;
  database: string;
  username: string;
  passwordPolicy: PasswordPolicy;
}

function isDriver(value: unknown): value is ConnectionDriver {
  return value === "mysql" || value === "mariadb" || value === "postgres";
}

function isPasswordPolicy(value: unknown): value is PasswordPolicy {
  return value === "never" || value === "restart" || value === "forever";
}

function parseProfile(value: unknown): ConnectionProfile | null {
  if (!value || typeof value !== "object") return null;

  const profile = value as Partial<ConnectionProfile>;
  if (!(
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    isDriver(profile.driver) &&
    typeof profile.host === "string" &&
    typeof profile.port === "number" &&
    typeof profile.database === "string" &&
    typeof profile.username === "string"
  )) return null;

  return {
    id: profile.id,
    name: profile.name,
    driver: profile.driver,
    host: profile.host,
    port: profile.port,
    database: profile.database,
    username: profile.username,
    passwordPolicy: isPasswordPolicy(profile.passwordPolicy)
      ? profile.passwordPolicy
      : "forever",
  };
}

function loadProfiles(): ConnectionProfile[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseProfile)
      .filter((profile): profile is ConnectionProfile => profile !== null);
  } catch {
    return [];
  }
}

export const connectionProfiles = writable<ConnectionProfile[]>(loadProfiles());

if (browser) {
  connectionProfiles.subscribe((profiles) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // La falta de almacenamiento no debe impedir conectar.
    }
  });
}

export function createConnectionProfileId(): string {
  return crypto.randomUUID();
}

export function saveConnectionProfile(profile: Omit<ConnectionProfile, "id"> & { id?: string }) {
  const saved: ConnectionProfile = {
    ...profile,
    id: profile.id ?? crypto.randomUUID(),
  };

  connectionProfiles.update((profiles) => {
    const existingIndex = profiles.findIndex((candidate) => candidate.id === saved.id);
    if (existingIndex === -1) return [...profiles, saved];

    return profiles.map((candidate) => (candidate.id === saved.id ? saved : candidate));
  });

  return saved;
}
