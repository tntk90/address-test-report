const API_KEY = 'f7a0f63e-64f0-4ce1-a0e9-a38b255c7888'
const BASE = 'https://api.addressify.com.au'

export function buildAddressifyAutocompleteUrl(term, mode = 'pro') {
  const path = mode === 'pro' ? '/addresspro/autocomplete' : '/address/autocomplete'
  return `${BASE}${path}?api_key=${API_KEY}&term=${encodeURIComponent(term)}&max=10`
}

// Pro endpoint: full structured address data
// Lite endpoint: basic autocomplete only
export async function addressifyAutocomplete(term, mode = 'pro') {
  const endpoint = mode === 'pro'
    ? `/addressify-api/addresspro/autocomplete`
    : `/addressify-api/address/autocomplete`

  const url = `${endpoint}?term=${encodeURIComponent(term)}&api_key=${API_KEY}&max=10`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Addressify autocomplete HTTP ${res.status}`)
  return await res.json()
  // Returns: array of address strings e.g. ["500 GEORGE ST, SYDNEY NSW 2000"]
}

// Get full parsed details for a specific address string (from autocomplete result)
export async function addressifyInfo(addressString) {
  const url = `/addressify-api/addresspro/info?term=${encodeURIComponent(addressString)}&api_key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Addressify info HTTP ${res.status}`)
  return await res.json()
  // Returns: { AddressFull, Number, Street, StreetType, Suburb, State, Postcode, Latitude, Longitude, Valid, ... }
}

// Validate a full address string
export async function addressifyValidate(address) {
  const url = `/addressify-api/addresspro/validate?address=${encodeURIComponent(address)}&api_key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Addressify validate HTTP ${res.status}`)
  return await res.json()
}
