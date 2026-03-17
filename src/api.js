// frontend/src/api.js
// Wrapper mínimo para centralizar `fetch`.
// Ventajas: un solo sitio para base URL, manejo de errores y headers comunes.

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:4000";

/**
 * GET simple a la API.
 * - Devuelve JSON si todo va bien.
 * - Si falla, lanza Error con un mensaje claro (para que el UI lo muestre).
 */
export async function apiGet(path) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    throw new Error(`Network error calling API: ${e?.message || String(e)}`);
  }

  // Intentamos parsear JSON siempre que podamos
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data;
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    // Si no es JSON, leemos texto (para errores tipo HTML/Plain)
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  // Manejo de errores HTTP (no 2xx)
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data.trim()) ||
      res.statusText ||
      `HTTP ${res.status}`;

    throw new Error(message);
  }

  return data;
}
