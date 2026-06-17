export function normalizeSaudiPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("05")) return `+966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+966${digits}`;
  return `+${digits}`;
}

export function toWaMe(phone: string, message: string) {
  const normalized = normalizeSaudiPhone(phone).replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
