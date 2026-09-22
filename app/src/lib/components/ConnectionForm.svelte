<script lang="ts">
  import { X } from "@lucide/svelte";
  import Field from "$lib/components/Field.svelte";
  import Button from "$lib/components/Button.svelte";
  import { getDriver, type ConnectionDriver } from "$lib/connections";
  import {
    connection,
    completeConnection,
    connect,
    testConnection,
    type ConnectionConfig,
  } from "$lib/stores/connection";
  import {
    createConnectionProfileId,
    saveConnectionProfile,
    type ConnectionProfile,
  } from "$lib/stores/connectionProfiles";
  import {
    loadConnectionPassword,
    saveConnectionPassword,
    type PasswordPolicy,
  } from "$lib/credentials";

  let {
    driver,
    profile = null,
    initialError = null,
    onclose,
  }: {
    driver: ConnectionDriver;
    profile?: ConnectionProfile | null;
    initialError?: string | null;
    onclose: () => void;
  } = $props();

  const driverDefinition = $derived(getDriver(driver));
  let dialogEl: HTMLDialogElement | undefined = $state();

  let profileId = $state("");
  let name = $state("");
  let host = $state("localhost");
  let port = $state(0);
  let username = $state("");
  let password = $state("");
  let passwordPolicy = $state<PasswordPolicy>("forever");
  let database = $state("");
  let initialized = $state(false);
  let attempted = $state(false);
  let testing = $state(false);
  let credentialLoading = $state(false);
  let saving = $state(false);
  let credentialError = $state<string | null>(null);
  let persistenceError = $state<string | null>(null);
  let testFeedback = $state<{ kind: "success" | "error"; message: string } | null>(null);
  let errors = $state<{
    name?: string;
    host?: string;
    port?: string;
    username?: string;
    database?: string;
  }>({});

  const busy = $derived(
    $connection.connecting || testing || credentialLoading || saving,
  );
  const connectionUrl = $derived.by(() => {
    const scheme = driverDefinition.backendKind === "mysql" ? "mysql" : "postgresql";
    const encodedUser = username.trim() ? `${encodeURIComponent(username.trim())}@` : "";
    const encodedDatabase = database.trim() ? `/${encodeURIComponent(database.trim())}` : "";
    return `${scheme}://${encodedUser}${host.trim() || "localhost"}:${Number(port) || driverDefinition.defaultPort}${encodedDatabase}`;
  });
  const passwordPolicyOptions = [
    { value: "never", label: "Nunca" },
    { value: "restart", label: "Hasta reiniciar" },
    { value: "forever", label: "Siempre" },
  ];

  $effect(() => {
    if (!initialized) {
      profileId = profile?.id ?? createConnectionProfileId();
      name = profile?.name ?? "";
      host = profile?.host ?? "localhost";
      port = profile?.port ?? driverDefinition.defaultPort;
      username = profile?.username ?? "";
      database = profile?.database ?? "";
      passwordPolicy = profile?.passwordPolicy ?? "forever";
      initialized = true;
      if (initialError) attempted = true;

      if (profile) void hydratePassword(profile.id, profile.passwordPolicy);
    }
  });

  $effect(() => {
    if (dialogEl && !dialogEl.open) dialogEl.showModal();
  });

  async function hydratePassword(id: string, policy: PasswordPolicy) {
    credentialLoading = true;
    credentialError = null;

    try {
      password = (await loadConnectionPassword(id, policy)) ?? "";
    } catch (error) {
      credentialError = `No se pudo leer la contraseña guardada: ${String(error)}`;
    } finally {
      credentialLoading = false;
    }
  }

  function validatedConfig(): ConnectionConfig | null {
    const nextErrors: typeof errors = {};

    if (!name.trim()) nextErrors.name = "Asigna un nombre a la conexión.";
    if (!host.trim()) nextErrors.host = "El host es obligatorio.";
    if (!database.trim()) nextErrors.database = "La base de datos es obligatoria.";
    if (!username.trim()) nextErrors.username = "El usuario es obligatorio.";

    const portValue = Number(port);
    if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
      nextErrors.port = "Introduce un puerto entre 1 y 65535.";
    }

    errors = nextErrors;
    if (Object.keys(nextErrors).length > 0) return null;

    return {
      host: host.trim(),
      port: portValue,
      database: database.trim(),
      username: username.trim(),
      password,
    };
  }

  async function handleTest() {
    const config = validatedConfig();
    if (!config) return;

    attempted = false;
    persistenceError = null;
    testFeedback = null;
    testing = true;

    try {
      await testConnection(driverDefinition.backendKind, config);
      testFeedback = { kind: "success", message: "Conexión establecida correctamente." };
    } catch (error) {
      testFeedback = { kind: "error", message: String(error) };
    } finally {
      testing = false;
    }
  }

  async function handleSubmit() {
    const config = validatedConfig();
    if (!config) return;

    attempted = true;
    persistenceError = null;
    testFeedback = null;
    const tableCount = await connect(driverDefinition.backendKind, config);
    if (tableCount === null) return;

    saving = true;
    try {
      await saveConnectionPassword(profileId, password, passwordPolicy);
      saveConnectionProfile({
        id: profileId,
        name: name.trim(),
        driver,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        passwordPolicy,
      });
      completeConnection(tableCount, profileId);
    } catch (error) {
      persistenceError = `La conexión funciona, pero no se pudo guardar la contraseña de forma segura: ${String(error)}`;
    } finally {
      saving = false;
    }
  }

  function requestClose() {
    if (!busy) dialogEl?.close();
  }

  function handleCancel(event: Event) {
    if (busy) event.preventDefault();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialogEl) requestClose();
  }
</script>

<dialog
  bind:this={dialogEl}
  aria-labelledby="connection-dialog-title"
  onclose={onclose}
  oncancel={handleCancel}
  onclick={handleBackdropClick}
>
  <header class="dialog-header">
    <img class="driver-icon" src={driverDefinition.icon} alt="" aria-hidden="true" />
    <div class="dialog-title">
      <h1 id="connection-dialog-title">
        {profile ? profile.name : "Nueva conexión"}
      </h1>
      <p>{driverDefinition.name}</p>
    </div>
    <button
      class="close"
      type="button"
      aria-label="Cerrar"
      onclick={requestClose}
      disabled={busy}
    >
      <X size={16} aria-hidden="true" />
    </button>
  </header>

  <form
    onsubmit={(event) => {
      event.preventDefault();
      handleSubmit();
    }}
  >
    <div class="form-body">
      <Field
        label="Nombre"
        id="connection-name"
        name="connection-name"
        bind:value={name}
        error={errors.name}
        autocomplete="off"
        orientation="horizontal"
        required
        disabled={busy}
      />

      <div class="endpoint">
        <Field
          label="Host"
          id="host"
          name="host"
          bind:value={host}
          error={errors.host}
          autocomplete="url"
          orientation="horizontal"
          required
          disabled={busy}
        />

        <Field
          label="Puerto"
          id="port"
          name="port"
          type="number"
          bind:value={port}
          error={errors.port}
          min={1}
          max={65535}
          orientation="compact"
          required
          disabled={busy}
        />
      </div>

      <Field
        label="Usuario"
        id="username"
        name="username"
        bind:value={username}
        error={errors.username}
        autocomplete="username"
        orientation="horizontal"
        required
        disabled={busy}
      />

      <div class="password-row">
        <Field
          label="Contraseña"
          id="password"
          name="password"
          type="password"
          bind:value={password}
          autocomplete="current-password"
          orientation="horizontal"
          disabled={busy}
        />
        <Field
          label="Guardar"
          id="password-policy"
          name="password-policy"
          type="select"
          bind:value={passwordPolicy}
          options={passwordPolicyOptions}
          orientation="compact"
          disabled={busy}
        />
      </div>

      <Field
        label="Base de datos"
        id="database"
        name="database"
        bind:value={database}
        error={errors.database}
        autocomplete="off"
        orientation="horizontal"
        required
        disabled={busy}
      />

      <div class="url-field">
        <Field
          label="URL"
          id="connection-url"
          name="connection-url"
          value={connectionUrl}
          orientation="horizontal"
          readonly
        />
      </div>

      {#if credentialLoading}
        <div role="status" class="credential-status">Cargando credencial segura…</div>
      {:else if credentialError}
        <div role="alert" class="feedback error"><span>{credentialError}</span></div>
      {/if}

      {#if persistenceError}
        <div role="alert" class="feedback error"><span>{persistenceError}</span></div>
      {/if}

      {#if attempted && $connection.error}
        <div role="alert" class="feedback error">
          <strong>No se pudo conectar con {host.trim() || "el servidor"}:{port}.</strong>
          <span>{$connection.error}</span>
        </div>
      {/if}

      {#if testFeedback}
        <div
          role={testFeedback.kind === "error" ? "alert" : "status"}
          class:error={testFeedback.kind === "error"}
          class="feedback"
        >
          <strong>
            {testFeedback.kind === "success"
              ? "La prueba fue correcta."
              : `No se pudo conectar con ${host.trim() || "el servidor"}:${port}.`}
          </strong>
          <span>{testFeedback.message}</span>
        </div>
      {/if}
    </div>

    <footer>
      <button class="test-action" type="button" onclick={handleTest} disabled={busy}>
        {testing ? "Probando…" : "Probar conexión"}
      </button>
      <div class="primary-actions">
        <Button type="button" variant="secondary" onclick={requestClose} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={$connection.connecting || saving} disabled={busy}>
          {$connection.connecting
            ? "Conectando…"
            : saving
              ? "Guardando…"
              : "Guardar y conectar"}
        </Button>
      </div>
    </footer>
  </form>
</dialog>

<style>
  dialog {
    width: min(46rem, calc(100vw - 2rem));
    max-width: none;
    max-height: calc(100vh - 2rem);
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-primary);
    box-shadow: var(--shadow-elevated);
  }

  .dialog-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    min-height: 3.75rem;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--border);
    background: var(--surface-elevated);
  }

  .driver-icon {
    display: block;
    width: 1.625rem;
    height: 1.625rem;
    object-fit: contain;
    filter: grayscale(1) brightness(1.35);
  }

  .dialog-title {
    min-width: 0;
  }

  h1 {
    overflow: hidden;
    margin: 0 0 2px;
    font-size: 0.9375rem;
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-heading);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dialog-title p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .close:hover:not(:disabled) {
    border-color: var(--border);
    background: var(--surface);
    color: var(--text-primary);
  }

  .close:focus-visible,
  .test-action:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .close:disabled {
    color: var(--control-disabled);
    cursor: not-allowed;
  }

  form {
    display: flex;
    max-height: calc(100vh - 6rem);
    flex-direction: column;
  }

  .form-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    overflow-y: auto;
    padding: var(--space-6);
  }

  .endpoint {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 13rem;
    gap: var(--space-5);
  }

  .password-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 13rem;
    gap: var(--space-5);
  }

  .url-field {
    margin-top: var(--space-3);
  }

  .credential-status {
    margin-left: calc(7.5rem + var(--space-4));
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .feedback {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-left: calc(7.5rem + var(--space-4));
    padding: var(--space-3);
    border-left: 2px solid var(--accent);
    background: color-mix(in srgb, var(--accent) 9%, transparent);
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .feedback.error {
    border-left-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 9%, transparent);
  }

  .feedback strong {
    font-weight: 600;
  }

  .feedback span {
    color: var(--text-secondary);
    overflow-wrap: anywhere;
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border);
    background: var(--surface-elevated);
  }

  .test-action {
    padding: var(--space-2) 0;
    border: 0;
    background: transparent;
    color: var(--accent);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .test-action:hover:not(:disabled) {
    text-decoration: underline;
  }

  .test-action:disabled {
    color: var(--control-disabled);
    cursor: not-allowed;
  }

  .primary-actions {
    display: flex;
    gap: var(--space-2);
  }

  @media (max-width: 34rem) {
    .form-body {
      padding: var(--space-4);
    }

    .credential-status,
    .feedback {
      margin-left: 0;
    }

    .endpoint {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }

    .password-row {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }

    footer {
      align-items: stretch;
      flex-direction: column;
    }

    .primary-actions {
      justify-content: flex-end;
    }
  }
</style>
