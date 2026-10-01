import { useEffect, useState } from "react";
import { Check } from "lucide-react";

function StoreToast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timeoutId;
    const showToast = (event) => {
      setMessage(event.detail?.message || "");
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setMessage(""), 3500);
    };

    window.addEventListener("store-toast", showToast);
    return () => {
      window.removeEventListener("store-toast", showToast);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="shop-toast-banner" role="status" aria-live="polite">
      <Check size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default StoreToast;