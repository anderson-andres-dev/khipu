// Copia texto al portapapeles. Si la API del navegador falla (permiso
// bloqueado por el sistema, o el webview no la expone), cae a un textarea
// temporal con execCommand("copy"), que sigue funcionando en ese caso.
// Quien la llama es responsable de devolver el foco donde corresponda: el
// textarea temporal se lo lleva.
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}
