export const DEFAULT_WHATSAPP_TEMPLATE =
  "السلام عليكم ورحمة الله وبركاته، نود التواصل معكم بخصوص خدمات اعتماد سباهي من شركة [اسم الشركة]";

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("966")) return digits;
  digits = digits.replace(/^0+/, "");
  return digits ? `966${digits}` : "";
}

export function isValidSaudiPhone(phone: string): boolean {
  return /^966(?:5\d{8}|1[1-7]\d{7})$/.test(normalizePhone(phone));
}

export function buildWhatsAppUrl(
  phone: string,
  companyName: string,
  template = DEFAULT_WHATSAPP_TEMPLATE,
): string {
  const number = normalizePhone(phone);
  const message = template.replaceAll("[اسم الشركة]", companyName);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
