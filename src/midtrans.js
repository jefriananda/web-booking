const SNAP_SCRIPT_ID = "midtrans-snap-script";

const snapScriptUrl = (isProduction) =>
  isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

let snapLoadPromise = null;
let loadedClientKey = "";
let loadedScriptUrl = "";

export function loadSnap({ clientKey, isProduction = false }) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Midtrans Snap hanya tersedia di browser."));
  }

  if (!clientKey) {
    return Promise.reject(new Error("Client key Midtrans belum tersedia."));
  }

  const scriptUrl = snapScriptUrl(isProduction);

  if (window.snap && loadedClientKey === clientKey && loadedScriptUrl === scriptUrl) {
    return Promise.resolve(window.snap);
  }

  if (snapLoadPromise && loadedClientKey === clientKey && loadedScriptUrl === scriptUrl) {
    return snapLoadPromise;
  }

  const existing = document.getElementById(SNAP_SCRIPT_ID);
  if (existing) existing.remove();

  loadedClientKey = clientKey;
  loadedScriptUrl = scriptUrl;
  snapLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SNAP_SCRIPT_ID;
    script.src = scriptUrl;
    script.dataset.clientKey = clientKey;
    script.async = true;
    script.onload = () => {
      if (window.snap) {
        resolve(window.snap);
      } else {
        snapLoadPromise = null;
        reject(new Error("Midtrans Snap gagal dimuat."));
      }
    };
    script.onerror = () => {
      snapLoadPromise = null;
      reject(new Error("Gagal memuat script Midtrans Snap."));
    };
    document.head.appendChild(script);
  });

  return snapLoadPromise;
}

export async function payWithSnap({ token, clientKey, isProduction = false, ...callbacks }) {
  if (!token) throw new Error("Snap token tidak tersedia.");

  const snap = await loadSnap({ clientKey, isProduction });
  snap.pay(token, callbacks);
}
