import { supportedCurrencies, useStoreSettings } from "../context/storeSettings";

function CurrencySelector() {
  const { settings, currencyPreference, setCurrencyPreference } = useStoreSettings();

  return (
    <select
      className="store-currency-select"
      aria-label="Display currency"
      title="Choose display currency"
      value={currencyPreference || ""}
      onChange={(event) => setCurrencyPreference(event.target.value || null)}
    >
      <option value="">Store default · {settings.currency}</option>
      {supportedCurrencies.map(({ code, label }) => (
        <option value={code} key={code}>{label}</option>
      ))}
    </select>
  );
}

export default CurrencySelector;
