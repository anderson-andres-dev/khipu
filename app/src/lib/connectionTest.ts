import type { TestConnectionReport, TlsStatus } from "$lib/types";

// Resumen de "Probar conexion" para el popover del formulario
// (ConnectionForm.svelte): el estado, el texto corto que queda junto al
// boton y las lineas del detalle, que tambien son lo que copia "Copiar".

export type TestOutcome = "success" | "warning" | "error";

export interface TestSummary {
  outcome: TestOutcome;
  title: string;
  // Texto corto junto al boton, p.ej. "MySQL 8.4.9".
  badge: string;
  lines: { label: string; value: string }[];
}

function describeTls(tls: TlsStatus): string {
  if (tls.encrypted === true) return tls.detail ? `sí (${tls.detail})` : "sí";
  if (tls.encrypted === false) {
    return tls.fellBack
      ? "no: el servidor ofrece un cifrado que Khipu no admite (común en MySQL 5.7). Usa SSL «Requerido» para que falle en vez de conectar así."
      : "no: el servidor no tiene TLS habilitado";
  }
  return "desconocido";
}

export function summarizeReport(report: TestConnectionReport): TestSummary {
  const unencrypted = report.tls.encrypted === false;
  const lines = [
    { label: "Servidor", value: report.serverVersion },
    ...(report.defaultSchema ? [{ label: "Schema", value: report.defaultSchema }] : []),
    { label: "Latencia", value: report.latencyMs === null ? "—" : `${report.latencyMs} ms` },
    { label: "SSL", value: describeTls(report.tls) },
  ];
  return {
    outcome: unencrypted ? "warning" : "success",
    title: unencrypted ? "Conectó sin cifrar" : "Conexión correcta",
    badge: report.serverVersion,
    lines,
  };
}

export function summarizeError(message: string, endpoint: string): TestSummary {
  return {
    outcome: "error",
    title: "No se pudo conectar",
    badge: "Falló",
    lines: [
      { label: "Destino", value: endpoint },
      { label: "Error", value: message },
    ],
  };
}

export function summaryText(summary: TestSummary): string {
  return [summary.title, ...summary.lines.map((line) => `${line.label}: ${line.value}`)].join("\n");
}
