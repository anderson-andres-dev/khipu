import { invoke } from "@tauri-apps/api/core";

export type PasswordPolicy = "never" | "restart" | "forever";

const runtimePasswords = new Map<string, string>();

export async function saveConnectionPassword(
  profileId: string,
  password: string,
  policy: PasswordPolicy,
): Promise<void> {
  if (policy === "forever") {
    runtimePasswords.delete(profileId);
    await invoke("save_connection_password", { profileId, password });
    return;
  }

  await invoke("delete_connection_password", { profileId });

  if (policy === "restart") runtimePasswords.set(profileId, password);
  else runtimePasswords.delete(profileId);
}

export async function loadConnectionPassword(
  profileId: string,
  policy: PasswordPolicy,
): Promise<string | null> {
  if (policy === "never") return null;
  if (policy === "restart") return runtimePasswords.get(profileId) ?? null;
  return invoke<string | null>("load_connection_password", { profileId });
}
