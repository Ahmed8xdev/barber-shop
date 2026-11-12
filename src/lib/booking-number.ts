/** Format a business owned WhatsApp number for the wa.me / api.whatsapp.com URL. */
export function parseBookingNumber(value: string | undefined | null): string | null {
  if (!value) return null;
  const input = value.trim();
  if (!/^\+?[\d\s()-]+$/.test(input)) return null;
  const digits = input.replace(/\D/g, "");
  return /^\d{8,15}$/.test(digits) ? digits : null;
}
