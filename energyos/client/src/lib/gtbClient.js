/**
 * Pings the GTB status endpoint
 * @param {string} url - The GTB base URL
 * @returns {Promise<{ok: boolean, status: number, message: string}>}
 */
export async function pingGTB(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/status`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { ok: true, status: response.status, message: 'Connexion réussie.' };
    }

    if (response.status === 404) {
      return { ok: false, status: 404, message: 'Point de terminaison introuvable (Erreur 404).' };
    }

    if (response.status === 500) {
      return { ok: false, status: 500, message: 'Erreur interne du serveur GTB (Erreur 500).' };
    }

    return { ok: false, status: response.status, message: `Erreur inattendue: ${response.statusText}` };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { ok: false, status: 0, message: 'Délai d\'attente dépassé (5s).' };
    }
    return { ok: false, status: 0, message: 'Erreur réseau ou connexion impossible.' };
  }
}

/**
 * Fetches the list of devices from the GTB
 * @param {string} url - The GTB base URL
 * @returns {Promise<Array>} Array of devices
 */
export async function getDevices(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/devices`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Délai d\'attente dépassé lors de la récupération des équipements.');
    }
    throw new Error('Erreur réseau lors de la récupération des équipements.');
  }
}
