<script lang="ts">
  import { connection } from "$lib/stores/connection";
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

  function openProfile(profile: ConnectionProfile) {
    connectionView = "landing";
    activeProfile = profile;
    selectedDriver = profile.driver;
  }

  function closeForm() {
    selectedDriver = null;
    activeProfile = null;
  }
</script>

<div class="stage">
  {#if $connection.connected}
    <Workspace />
  {:else if connectionView === "landing"}
    <ConnectionLanding
      profiles={$connectionProfiles}
      onnewconnection={startConnection}
      onopen={openProfile}
    />
  {:else}
    <DriverPicker selected={selectedDriver} onselect={selectDriver} oncancel={showLanding} />
  {/if}

  {#if !$connection.connected && selectedDriver}
    <ConnectionForm driver={selectedDriver} profile={activeProfile} onclose={closeForm} />
  {/if}
</div>

<style>
  .stage {
    height: 100%;
    min-height: 0;
  }
</style>
