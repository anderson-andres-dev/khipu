<script lang="ts">
  import { connection, connectToProfile, pendingEdit } from "$lib/stores/connection";
  import {
    connectionProfiles,
    type ConnectionProfile,
  } from "$lib/stores/connectionProfiles";
  import type { ConnectionDriver } from "$lib/connections";
  import ConnectionLanding from "$lib/components/ConnectionLanding.svelte";
  import DriverPicker from "$lib/components/DriverPicker.svelte";
  import ConnectionForm from "$lib/components/ConnectionForm.svelte";
  import Workspace from "$lib/components/Workspace.svelte";

  type ConnectionView = "landing" | "drivers";

  let connectionView = $state<ConnectionView>("landing");
  let selectedDriver = $state<ConnectionDriver | null>(null);
  let activeProfile = $state<ConnectionProfile | null>(null);
  let fallbackError = $state<string | null>(null);
  let connectingId = $state<string | null>(null);

  function startConnection() {
    selectedDriver = null;
    activeProfile = null;
    connectionView = "drivers";
  }

  function selectDriver(driver: ConnectionDriver) {
    selectedDriver = driver;
    activeProfile = null;
  }

  function showLanding() {
    selectedDriver = null;
    activeProfile = null;
    connectionView = "landing";
  }

  function openProfile(profile: ConnectionProfile, error: string | null = null) {
    connectionView = "landing";
    activeProfile = profile;
    selectedDriver = profile.driver;
    fallbackError = error;
  }

  async function handleConnect(profile: ConnectionProfile) {
    connectingId = profile.id;
    const result = await connectToProfile(profile);
    connectingId = null;
    if (!result.ok) {
      openProfile(profile, result.reason === "connect-failed" ? result.error : null);
    }
  }

  function closeForm() {
    selectedDriver = null;
    activeProfile = null;
    fallbackError = null;
  }

  // Puente para cuando el selector de conexiones del topbar (+layout.svelte)
  // falla al cambiar de conexion: abre el modal de edicion con el perfil y
  // el error correspondientes, igual que si hubiera fallado desde esta pagina.
  $effect(() => {
    const pending = $pendingEdit;
    if (pending) {
      openProfile(pending.profile, pending.error);
      pendingEdit.set(null);
    }
  });
</script>

<div class="stage">
  {#if $connection.connected}
    <Workspace />
  {:else if connectionView === "landing"}
    <ConnectionLanding
      profiles={$connectionProfiles}
      {connectingId}
      onnewconnection={startConnection}
      onconnect={handleConnect}
      onedit={openProfile}
    />
  {:else}
    <DriverPicker selected={selectedDriver} onselect={selectDriver} oncancel={showLanding} />
  {/if}

  {#if !$connection.connected && selectedDriver}
    <ConnectionForm
      driver={selectedDriver}
      profile={activeProfile}
      initialError={fallbackError}
      onclose={closeForm}
    />
  {/if}
</div>

<style>
  .stage {
    height: 100%;
    min-height: 0;
  }
</style>
