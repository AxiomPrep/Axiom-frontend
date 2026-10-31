/** Blocks phone numbers shared as chat text. Filenames and years are left alone. */
export function containsPhoneNumber(text: string) {
  const cleaned = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
  const groups = cleaned.match(/\+?\d[\d\s().-]{8,}\d/g) || [];
  return groups.some((group) => {
    const digits = group.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  });
}
