/**
 * extractStreetPart(address) → string
 *
 * Returns the portion of an address string suitable for autocomplete queries.
 * Skips leading unit/suite/level/floor prefixes and finds the part that begins
 * with an actual street number.
 *
 * Examples:
 *   "Suite 48 Level 9, 88 Pitt ST, Sydney NSW 2000"  → "88 Pitt ST"
 *   "Unit 15, 11-21 Underwood RD, Homebush NSW 2140" → "11-21 Underwood RD"
 *   "3, 437 Yangebup RD, Cockburn Central WA 6164"   → "437 Yangebup RD"
 *   "500 George St, Sydney NSW 2000"                 → "500 George St"
 */
export function extractStreetPart(address) {
  if (!address) return ''

  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)

  // Keywords that indicate this part is a unit/level/floor, not a street
  const unitPrefixRe =
    /^(unit|suite|level|floor|shop|lot|flat|apt|apartment|po\s+box)\b/i

  for (const part of parts) {
    // Skip known unit/suite/level/floor keyword prefixes
    if (unitPrefixRe.test(part)) continue
    // Skip bare numbers (e.g. "3" = unit number only)
    if (/^\d+$/.test(part)) continue
    // First part that starts with a digit followed by non-digit = street number
    if (/^\d/.test(part)) return part
  }

  // Fallback: just take the first part (handles plain "500 George St" with no comma)
  return parts[0] || address.trim()
}
