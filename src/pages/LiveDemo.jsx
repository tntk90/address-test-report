import { useState } from 'react'
import AutocompleteInput from '../components/live/AutocompleteInput'
import AddressFieldsPanel from '../components/live/AddressFieldsPanel'
import { addressifyInfo } from '../api/addressify'
import { kleberAutocomplete, kleberGetAddressDetails } from '../api/kleber'
import { extractStreetPart } from '../utils/addressUtils'

export default function LiveDemo() {
  const [mode, setMode] = useState('pro')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [addrInfo, setAddrInfo] = useState(null)
  const [kleberInfo, setKleberInfo] = useState(null)
  const [addrLoading, setAddrLoading] = useState(false)
  const [kleberLoading, setKleberLoading] = useState(false)
  const [addrError, setAddrError] = useState(null)
  const [kleberError, setKleberError] = useState(null)

  const handleSelect = async (suggestion) => {
    if (!suggestion) {
      setSelectedAddress(null)
      setAddrInfo(null)
      setKleberInfo(null)
      setAddrError(null)
      setKleberError(null)
      return
    }

    setSelectedAddress(suggestion)
    setAddrInfo(null)
    setKleberInfo(null)
    setAddrError(null)
    setKleberError(null)

    // --- Addressify info ---
    setAddrLoading(true)
    try {
      const info = await addressifyInfo(suggestion)
      setAddrInfo(info)
    } catch (err) {
      setAddrError(err.message)
    } finally {
      setAddrLoading(false)
    }

    // --- Kleber (run in parallel, independent) ---
    const streetPart = extractStreetPart(suggestion)
    setKleberLoading(true)
    try {
      const kleberResult = await kleberAutocomplete(streetPart)
      const records = kleberResult?.DtResponse?.Result || []
      const first = records[0]
      if (first?.RecordId) {
        const detail = await kleberGetAddressDetails(first.RecordId)
        setKleberInfo(detail?.DtResponse?.Result?.[0] || null)
      } else {
        setKleberInfo(null)
        if (records.length === 0) setKleberError('No results returned by Kleber')
      }
    } catch (err) {
      setKleberError(err.message)
    } finally {
      setKleberLoading(false)
    }
  }

  const isValid = addrInfo?.Valid

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* Top controls row */}
        <div style={styles.topBar}>
          <div style={styles.modeGroup}>
            {['pro', 'lite'].map((m) => (
              <label key={m} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="live-mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  style={{ marginRight: 5 }}
                />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </label>
            ))}
          </div>

          {selectedAddress && !addrLoading && (
            <div style={styles.validBadgeTop}>
              {isValid === true && <span style={{ ...styles.badge, background: '#dcfce7', color: '#166534' }}>✅ Address is valid.</span>}
              {isValid === false && <span style={{ ...styles.badge, background: '#fee2e2', color: '#991b1b' }}>❌ Address is invalid.</span>}
              {isValid === undefined && <span style={{ ...styles.badge, background: '#f1f5f9', color: '#64748b' }}>— Validation pending</span>}
            </div>
          )}
        </div>

        {/* Autocomplete section */}
        <div style={styles.card}>
          <p style={styles.fieldLabel}>Address Autocomplete</p>
          <AutocompleteInput mode={mode} onSelect={handleSelect} />
          {selectedAddress && (
            <p style={styles.selectedHint}>
              Selected: <strong>{selectedAddress}</strong>
            </p>
          )}
        </div>

        {/* Fields panels */}
        {selectedAddress ? (
          <div style={styles.panelGrid}>
            <AddressFieldsPanel
              title="Addressify"
              accentColor="#0f3460"
              source="addressify"
              info={addrInfo}
              loading={addrLoading}
              errorMessage={addrError}
            />
            <AddressFieldsPanel
              title="Kleber"
              accentColor="#533483"
              source="kleber"
              info={kleberInfo}
              loading={kleberLoading}
              errorMessage={kleberError}
            />
          </div>
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderIcon}>🔍</span>
            <p style={styles.placeholderText}>Type an address above and select a suggestion to see parsed fields from both APIs</p>
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  page: { background: '#f5f7fa', minHeight: 'calc(100vh - 120px)', padding: '24px 0 64px' },
  inner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px' },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  modeGroup: { display: 'flex', gap: 16, alignItems: 'center' },
  radioLabel: { display: 'flex', alignItems: 'center', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  validBadgeTop: { display: 'flex', alignItems: 'center' },
  badge: { fontSize: 13, fontWeight: 600, padding: '5px 14px', borderRadius: 20 },
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: 20,
  },
  fieldLabel: { margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#475569' },
  selectedHint: { margin: '10px 0 0', fontSize: 12, color: '#94a3b8' },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    background: '#fff',
    borderRadius: 10,
    border: '2px dashed #e2e8f0',
    textAlign: 'center',
  },
  placeholderIcon: { fontSize: 40, marginBottom: 16 },
  placeholderText: { fontSize: 15, color: '#94a3b8', maxWidth: 380, margin: 0, lineHeight: 1.6 },
}
