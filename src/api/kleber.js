const API_KEY   = 'RK-B5542-077EF-6DEF0-ECFD5-1E343-E8356-DC1A7-E8264'
const ENDPOINT  = 'https://lightyeardocs-devuat.datatoolscloud.net.au/KleberWebService/DtKleberService.svc/ProcessQueryJsonRequest'
const PROXY_URL = '/kleber-api'
const TIMEOUT_MS = 10000

export function buildKleberAutocompleteUrl(addressLine) {
  // POST API — show the endpoint + method as display reference
  return `POST ${ENDPOINT} | SearchAddress("${addressLine}")`
}

async function postKleber(body, timeout = TIMEOUT_MS) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ DtRequest: { RequestKey: API_KEY, OutputFormat: 'json', ...body } }),
      signal: controller.signal,
    })
    clearTimeout(id)
    if (!res.ok) throw new Error(`Kleber HTTP ${res.status}`)
    const data = await res.json()
    const errMsg = data?.DtResponse?.ErrorMessage
    if (errMsg) throw new Error(`Kleber: ${errMsg}`)
    return data
  } catch (err) {
    clearTimeout(id)
    if (err.name === 'AbortError') throw new Error(`Kleber request timed out after ${timeout / 1000}s`)
    throw err
  }
}

export async function kleberAutocomplete(addressLine) {
  return postKleber({
    Method: 'DataTools.Capture.Address.Predictive.AuPaf.SearchAddress',
    AddressLine: addressLine,
    ResultLimit: '10',
    SearchOption: 'A002',
  })
  // Returns: { DtResponse: { ResultCount, Result: [{ RecordId, AddressLine, Locality, State, Postcode }] } }
}

export async function kleberGetAddressDetails(RecordId) {
  return postKleber({
    Method: 'DataTools.Capture.Address.Predictive.AuPaf.RetrieveAddress',
    RecordId,
  })
  // Returns: { DtResponse: { Result: [{ StreetNumber1, StreetName, StreetType, StreetSuffix,
  //   UnitType, UnitNumber, LevelType, LevelNumber, BuildingName,
  //   AddressLine, Locality, State, Postcode, DPID }] } }
}
