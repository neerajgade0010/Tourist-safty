/**
 * Build a WhatsApp click-to-chat link.
 * @param {string} e164Phone - Phone number in E.164 format (e.g. "+14155552671")
 * @param {string} trackingLink - URL to include in the message
 * @param {string} senderName - Name of the person sending the SOS
 * @returns {string} WhatsApp URL
 */
export const buildWhatsAppLink = (e164Phone, trackingLink, senderName) => {
  const phone = e164Phone.replace(/\D/g, "");
  const message = `🚨 SOS Alert from ${senderName}! Track their location: ${trackingLink}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
