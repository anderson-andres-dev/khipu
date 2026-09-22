<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { connection } from "$lib/stores/connection";
  import ConnectionForm from "$lib/components/ConnectionForm.svelte";
  import Workspace from "$lib/components/Workspace.svelte";

  // La duración sale de `--duration-fast` (tokens.css), nunca de un valor
  // hardcodeado acá: así `prefers-reduced-motion` (que redefine el token a
  // 0ms) apaga el cross-fade solo, sin lógica adicional en este componente.
  let fadeDuration = $state(150);

  onMount(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--duration-fast");
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      fadeDuration = parsed;
    }
  });
</script>

<div class="stage">
  {#if $connection.connected}
    <div class="fade" transition:fade={{ duration: fadeDuration }}>
      <Workspace />
    </div>
  {:else}
    <div class="fade" transition:fade={{ duration: fadeDuration }}>
      <ConnectionForm />
    </div>
  {/if}
</div>

<style>
  .stage {
    height: 100%;
  }

  .fade {
    height: 100%;
  }
</style>
