/**
 * Helper pour faire des fetch avec timeout
 * Évite les requêtes infinies vers les APIs externes
 */
export const fetchWithTimeout = async (url, options = {}, timeoutMs = 60000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`La requête a pris trop de temps (>${timeoutMs / 1000}s). Veuillez réessayer.`);
    }
    throw error;
  }
};
