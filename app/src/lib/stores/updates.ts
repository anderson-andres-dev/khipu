import { browser } from "$app/environment";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { derived, get, writable } from "svelte/store";

// Estado de Ajustes > Actualizaciones. La lista sale de los GitHub Releases
// (updates.rs); instalar una versión, más nueva o más vieja, siempre lo pide
// el usuario.

export type InstallKind = "appImage" | "deb" | "rpm" | "pacman" | "windows" | "macos" | "source";

export interface UpdateContext {
  currentVersion: string;
  installKind: InstallKind;
  canInstall: boolean;
  releasesPage: string;
}

export interface ReleaseInfo {
  tag: string;
  version: string;
  name: string;
  notes: string;
  publishedAt: string | null;
  prerelease: boolean;
  url: string;
  relation: "current" | "newer" | "older";
  installable: boolean;
}

export type UpdateErrorCode =
  | "offline"
  | "rateLimited"
  | "network"
  | "unavailable"
  | "signature"
  | "cancelled"
  | "noPkexec"
  | "installFailed"
  | "notInstallable";

export interface UpdatePrefs {
  autoCheck: boolean;
  includePrereleases: boolean;
}

export type InstallState =
  | { phase: "idle" }
  | { phase: "downloading"; tag: string; version: string; downloaded: number; total: number | null }
  | { phase: "installing"; tag: string; version: string }
  | { phase: "done"; tag: string; version: string }
  | { phase: "error"; tag: string; version: string; code: UpdateErrorCode };

const PREFS_KEY = "khipu:updates:v1";
const DEFAULT_PREFS: UpdatePrefs = { autoCheck: true, includePrereleases: false };

function loadPrefs(): UpdatePrefs {
  if (!browser) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null") as Partial<UpdatePrefs> | null;
    return {
      autoCheck: parsed?.autoCheck !== false,
      includePrereleases: parsed?.includePrereleases === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export const updatePrefs = writable<UpdatePrefs>(loadPrefs());

if (browser) {
  updatePrefs.subscribe((prefs) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Sin almacenamiento, las preferencias duran lo que la ventana.
    }
  });
}

export const updateContext = writable<UpdateContext | null>(null);
export const releases = writable<ReleaseInfo[] | null>(null);
export const releasesError = writable<UpdateErrorCode | null>(null);
export const checking = writable(false);
export const lastChecked = writable<Date | null>(null);
export const installState = writable<InstallState>({ phase: "idle" });

/** Versiones que se muestran: las preliminares solo si el usuario las pidió, salvo la instalada. */
export const visibleReleases = derived([releases, updatePrefs], ([$releases, $prefs]) =>
  ($releases ?? []).filter((release) => $prefs.includePrereleases || !release.prerelease || release.relation === "current"),
);

/** La versión más nueva que la instalada, si la hay; alimenta el punto de aviso en Ajustes. */
export const newerRelease = derived(visibleReleases, ($visible) =>
  $visible.find((release) => release.relation === "newer") ?? null,
);

export function errorCode(error: unknown): UpdateErrorCode {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code as UpdateErrorCode;
  }
  return "network";
}

export async function loadUpdateContext(): Promise<UpdateContext> {
  const context = await invoke<UpdateContext>("update_context");
  updateContext.set(context);
  return context;
}

export async function checkForUpdates(): Promise<void> {
  if (get(checking)) return;
  checking.set(true);
  releasesError.set(null);
  try {
    if (!get(updateContext)) await loadUpdateContext();
    releases.set(await invoke<ReleaseInfo[]>("list_releases"));
    lastChecked.set(new Date());
  } catch (error) {
    releasesError.set(errorCode(error));
  } finally {
    checking.set(false);
  }
}

/** Búsqueda silenciosa al arrancar: solo si el usuario la dejó activada. */
export async function checkOnStartup(): Promise<void> {
  if (!get(updatePrefs).autoCheck) return;
  await checkForUpdates();
}

export async function installRelease(release: ReleaseInfo): Promise<void> {
  const state = get(installState);
  if (state.phase === "downloading" || state.phase === "installing") return;
  const { tag, version } = release;
  installState.set({ phase: "downloading", tag, version, downloaded: 0, total: null });
  const unlisten = await listen<{ downloaded: number; total: number | null }>("update-progress", (event) => {
    const { downloaded, total } = event.payload;
    // Con la descarga completa, lo que sigue es instalar (y pedir la contraseña).
    if (total !== null && downloaded >= total) installState.set({ phase: "installing", tag, version });
    else installState.set({ phase: "downloading", tag, version, downloaded, total });
  });
  try {
    await invoke("install_release", { tag });
    installState.set({ phase: "done", tag, version });
  } catch (error) {
    installState.set({ phase: "error", tag, version, code: errorCode(error) });
  } finally {
    unlisten();
  }
}

export function restartApp(): Promise<void> {
  return invoke("restart_app");
}
