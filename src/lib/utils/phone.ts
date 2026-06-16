export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2)
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  if (cleaned.startsWith('966')) return cleaned
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
  return '966' + cleaned
}
