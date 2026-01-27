// Always route to the correct support number.
// E.164 without '+'
const WHATSAPP_SUPPORT_PHONE = "919686638787";
const DEFAULT_MESSAGE = "Hi Kyra! I'd like to know more about your ride services.";
const WHATSAPP_SUPPORT_LINK = `https://api.whatsapp.com/send?phone=${WHATSAPP_SUPPORT_PHONE}&text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

/**
 * Open Kyra support chat.
 * Tries the wa.me message deep-link first; if blocked by the browser/network, falls back to phone-based WhatsApp.
 */
export function openWhatsAppSupport() {
  try {
    const w = window.open(WHATSAPP_SUPPORT_LINK, "_blank", "noopener,noreferrer");
    // If a popup blocker prevents opening a new tab, navigate in the current tab.
    if (!w) window.location.href = WHATSAPP_SUPPORT_LINK;
  } catch {
    window.location.href = WHATSAPP_SUPPORT_LINK;
  }
}

export function getWhatsAppSupportLink() {
  return WHATSAPP_SUPPORT_LINK;
}
