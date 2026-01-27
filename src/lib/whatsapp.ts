const WHATSAPP_MESSAGE_LINK = "https://wa.me/message/PWIMWJHRYGQRL1";

// Fallback uses the phone number directly (more reliable than a message deep-link).
// E.164 without '+'
const WHATSAPP_SUPPORT_PHONE = "919686638787";
const WHATSAPP_FALLBACK_LINK = `https://api.whatsapp.com/send?phone=${WHATSAPP_SUPPORT_PHONE}`;

/**
 * Open Kyra support chat.
 * Tries the wa.me message deep-link first; if blocked by the browser/network, falls back to phone-based WhatsApp.
 */
export function openWhatsAppSupport() {
  try {
    const w = window.open(WHATSAPP_MESSAGE_LINK, "_blank", "noopener,noreferrer");
    // If a popup blocker prevents opening a new tab, navigate in the current tab.
    if (!w) window.location.href = WHATSAPP_FALLBACK_LINK;
  } catch {
    window.location.href = WHATSAPP_FALLBACK_LINK;
  }
}

export function getWhatsAppSupportLink() {
  return WHATSAPP_MESSAGE_LINK;
}
