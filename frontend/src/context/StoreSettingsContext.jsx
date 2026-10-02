import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import { StoreSettingsContext, defaultSettings, normalizeSettings } from "./storeSettings";
const SETTINGS_EVENT = "store-settings-updated";

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try { return normalizeSettings(JSON.parse(localStorage.getItem("khan-store-settings") || "{}")); }
    catch { return defaultSettings; }
  });

  useEffect(() => {
    let active = true;
    const loadSettings = () => axios.get(`${API_BASE_URL}/store/settings`).then(({ data }) => {
      if (!active) return;
      const next = normalizeSettings(data);
      const serialized = JSON.stringify(next);
      if (localStorage.getItem("khan-store-settings") !== serialized) {
        setSettings(next);
        localStorage.setItem("khan-store-settings", serialized);
      }
    }).catch(() => {});
    loadSettings();
    const settingsTimer = window.setInterval(loadSettings, 5000);
    const refresh = () => {
      try { setSettings(normalizeSettings(JSON.parse(localStorage.getItem("khan-store-settings") || "{}"))); }
      catch { setSettings(defaultSettings); }
    };
    window.addEventListener(SETTINGS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { active = false; window.clearInterval(settingsTimer); window.removeEventListener(SETTINGS_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const value = useMemo(() => ({
    settings,
    applySettings(next) {
      const merged = normalizeSettings(next);
      setSettings(merged);
      localStorage.setItem("khan-store-settings", JSON.stringify(merged));
      window.dispatchEvent(new Event(SETTINGS_EVENT));
    },
    formatCurrency(amount) {
      try { return new Intl.NumberFormat(undefined, { style: "currency", currency: settings.currency }).format(Number(amount) || 0); }
      catch { return `${settings.currency} ${(Number(amount) || 0).toFixed(2)}`; }
    }
  }), [settings]);

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}
