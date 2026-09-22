<script lang="ts">
  import Field from "$lib/components/Field.svelte";
  import Button from "$lib/components/Button.svelte";
  import { connection, connect } from "$lib/stores/connection";

  type Kind = "mysql" | "postgres";

  const engineOptions = [
    { value: "mysql", label: "MySQL / MariaDB" },
    { value: "postgres", label: "PostgreSQL" },
  ];

  function defaultPort(k: Kind): number {
    return k === "mysql" ? 3306 : 5432;
  }

  let kind = $state<Kind>("mysql");
  let host = $state("");
  let port = $state(defaultPort("mysql"));
  let username = $state("");
  let password = $state("");
  let database = $state("");
  let portTouched = $state(false);

  // Prellena el puerto según el motor mientras el usuario no lo haya tocado
  // a mano. `suppressTouch` evita que la propia asignación programática de
  // `port` (abajo) se interprete como una edición manual en el segundo effect.
  let suppressTouch = false;

  $effect(() => {
    const currentKind = kind;
    if (!portTouched) {
      suppressTouch = true;
      port = defaultPort(currentKind);
    }
  });

  $effect(() => {
    port;
    if (suppressTouch) {
      suppressTouch = false;
    } else {
      portTouched = true;
    }
  });

  let errors = $state<{ host?: string; port?: string; username?: string; database?: string }>({});

  async function handleSubmit() {
    const nextErrors: typeof errors = {};

    if (!host.trim()) {
      nextErrors.host = "El host es obligatorio.";
    }
    if (!database.trim()) {
      nextErrors.database = "La base de datos es obligatoria.";
    }
    if (!username.trim()) {
      nextErrors.username = "El usuario es obligatorio.";
    }
    const portValue = Number(port);
    if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
      nextErrors.port = "El puerto debe ser un número entre 1 y 65535.";
    }

    errors = nextErrors;

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await connect(kind, {
      host: host.trim(),
      port: portValue,
      database: database.trim(),
      username: username.trim(),
      password,
    });
  }
</script>

<div class="wrapper">
  <div class="card">
    <h2>Conectar a una base de datos</h2>

    <form
      onsubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <Field
        label="Motor"
        id="engine"
        type="select"
        options={engineOptions}
        bind:value={kind}
      />

      <Field label="Host" id="host" bind:value={host} error={errors.host} placeholder="localhost" />

      <Field label="Puerto" id="port" type="number" bind:value={port} error={errors.port} />

      <Field label="Usuario" id="username" bind:value={username} error={errors.username} />

      <Field label="Contraseña" id="password" type="password" bind:value={password} />

      <Field
        label="Base de datos"
        id="database"
        bind:value={database}
        error={errors.database}
      />

      <Button variant="primary" loading={$connection.connecting} disabled={$connection.connecting}>
        Conectar
      </Button>
    </form>

    {#if $connection.error}
      <p role="alert" class="form-error">{$connection.error}</p>
    {/if}
  </div>
</div>

<style>
  .wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: min(360px, 90vw);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-elevated);
    border-radius: var(--radius-md);
    padding: var(--space-6);
  }

  h2 {
    margin: 0;
    font-size: var(--font-size-heading);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--tracking-heading);
    line-height: var(--leading-heading);
    color: var(--text-primary);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .form-error {
    margin: 0;
    color: var(--danger);
    font-size: 0.8125rem;
  }
</style>
