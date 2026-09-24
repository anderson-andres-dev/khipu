<script lang="ts">
  import { getDriver, type ConnectionDriver } from "$lib/connections";

  // Logo de un motor en un tono uniforme. Un filtro grayscale respeta la
  // luminosidad original de cada logo (el delfin de MySQL queda mas oscuro
  // que el elefante de PostgreSQL), asi que en vez de eso se usa el logo
  // como mascara y se pinta con un solo color del tema: todos quedan en
  // exactamente el mismo gris.
  let {
    driver,
    size = 32,
  }: {
    driver: ConnectionDriver;
    size?: number;
  } = $props();

  const definition = $derived(getDriver(driver));
</script>

<span
  class="driver-logo"
  style:--logo={`url("${definition.icon}")`}
  style:--size={`${size}px`}
  aria-hidden="true"
></span>

<style>
  .driver-logo {
    display: inline-block;
    flex-shrink: 0;
    width: var(--size);
    height: var(--size);
    background: var(--text-secondary);
    -webkit-mask: var(--logo) center / contain no-repeat;
    mask: var(--logo) center / contain no-repeat;
  }
</style>
