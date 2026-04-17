/**
 * ASIC CSV Parser Utility
 *
 * Parses tbl_asic_log.csv where the `request` column contains
 * base64-encoded SOAP/XML. Extracts <uri4:address> blocks from
 * each XML and normalises them into plain address objects.
 *
 * To swap in a new CSV file, change the CSV_URL constant below.
 */

const CSV_URL = '/tbl_asic_log.csv'

// ─── HTML entity decoder ───────────────────────────────────────────────────
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&apos;': "'", '&quot;': '"' }
function decodeEntities(str) {
  return str.replace(/&(?:amp|lt|gt|apos|quot);/g, (m) => ENTITIES[m] || m)
}

// ─── Extract one tag value ─────────────────────────────────────────────────
function getTag(xml, tag) {
  const m = new RegExp(`<uri4:${tag}>(.*?)<\\/uri4:${tag}>`, 's').exec(xml)
  return m ? decodeEntities(m[1].trim()) : ''
}

// ─── Build a formatted AU address string from a parsed address object ──────
export function buildAddressString(addr) {
  const parts = []
  if (addr.floor)    parts.push(addr.floor)
  if (addr.property) parts.push(addr.property)
  if (addr.unit)     parts.push(addr.unit)

  const street = [addr.streetNumber, addr.streetName, addr.streetType]
    .filter(Boolean).join(' ').trim()
  if (street) parts.push(street)

  // Suburb, State Postcode  (e.g. "Sydney NSW 2000")
  const suburbPart = [addr.suburb, addr.state, addr.postcode].filter(Boolean).join(' ')
  if (suburbPart) parts.push(suburbPart)

  return parts.join(', ')
}

// ─── Parse a single <uri4:address> XML block ──────────────────────────────
function parseAddressBlock(block, rowId) {
  const addr = {
    rowId,
    floor:        getTag(block, 'floorNumber'),
    property:     getTag(block, 'propertyName'),
    unit:         getTag(block, 'unitOrOfficeNumber'),
    streetNumber: getTag(block, 'streetNumber'),
    streetName:   getTag(block, 'streetName'),
    streetType:   getTag(block, 'streetType'),
    suburb:       getTag(block, 'locality'),
    state:        getTag(block, 'state'),
    postcode:     getTag(block, 'postCode'),
    country:      getTag(block, 'country'),
  }
  addr.formattedAddress = buildAddressString(addr)
  return addr
}

// ─── Parse a CSV field (handles quoted values with internal commas) ────────
function parseCsvLine(line) {
  const fields = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      // quoted field
      i++ // skip opening quote
      let val = ''
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          val += '"'
          i += 2
        } else if (line[i] === '"') {
          i++ // skip closing quote
          break
        } else {
          val += line[i++]
        }
      }
      fields.push(val)
      if (line[i] === ',') i++ // skip comma
    } else {
      // unquoted field
      const end = line.indexOf(',', i)
      if (end === -1) {
        fields.push(line.slice(i))
        break
      }
      fields.push(line.slice(i, end))
      i = end + 1
    }
  }
  return fields
}

// ─── Main CSV parser ───────────────────────────────────────────────────────
/**
 * parseAsicCsv(csvText) → address[]
 *
 * Accepts the raw text of tbl_asic_log.csv (or any CSV with the same schema).
 * Returns a flat array of parsed address objects, one per <uri4:address> block.
 */
export function parseAsicCsv(csvText) {
  const lines = csvText.split('\n')
  const header = lines[0]

  // Find column indexes from header
  const headerFields = parseCsvLine(header)
  const idIdx      = headerFields.indexOf('id')
  const requestIdx = headerFields.indexOf('request')

  if (requestIdx === -1) {
    throw new Error('CSV missing "request" column')
  }

  const addresses = []

  for (let li = 1; li < lines.length; li++) {
    const line = lines[li].trim()
    if (!line) continue

    const fields = parseCsvLine(line)
    const rowId  = idIdx >= 0 ? fields[idIdx] : String(li)
    const b64    = fields[requestIdx]
    if (!b64) continue

    let xml
    try {
      xml = atob(b64)
    } catch {
      continue // skip malformed base64
    }

    // Find all <uri4:address> blocks
    const addrRe = /<uri4:address>([\s\S]*?)<\/uri4:address>/g
    let m
    while ((m = addrRe.exec(xml)) !== null) {
      const addr = parseAddressBlock(m[1], rowId)
      // Only include addresses with at least a street or suburb
      if (addr.streetName || addr.suburb) {
        addresses.push(addr)
      }
    }
  }

  // Deduplicate by normalised formattedAddress (case-insensitive, whitespace-collapsed)
  const seen = new Set()
  return addresses.filter((a) => {
    const key = a.formattedAddress.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── Singleton cache — fetch + parse once per session ─────────────────────
let _cache = null

/**
 * loadAsicAddresses() → Promise<address[]>
 *
 * Fetches CSV_URL, parses it, and caches the result.
 * Subsequent calls return the cached data immediately.
 */
export async function loadAsicAddresses() {
  if (_cache) return _cache
  _cache = fetch(CSV_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`)
      return res.text()
    })
    .then((text) => parseAsicCsv(text))
    .catch((err) => {
      _cache = null // allow retry on failure
      throw err
    })
  return _cache
}
