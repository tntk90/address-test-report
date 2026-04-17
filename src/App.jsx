import { useState, useCallback } from 'react'
import AddressTextarea from './components/AddressTextarea'
import ResultCard from './components/ResultCard'
import ReportPanel from './components/ReportPanel'
import LiveDemo from './pages/LiveDemo'
import AsicAddresses from './pages/AsicAddresses'
import { addressifyAutocomplete, addressifyInfo, addressifyValidate, buildAddressifyAutocompleteUrl } from './api/addressify'
import { kleberAutocomplete, kleberGetAddressDetails, buildKleberAutocompleteUrl } from './api/kleber'
import { extractStreetPart } from './utils/addressUtils'

const DELAY_MS = 400

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export default function App() {
  const [activeTab, setActiveTab] = useState('batch') // 'batch' | 'live'
  const [mode, setMode] = useState('pro') // 'pro' | 'lite'
  const [addresses, setAddresses] = useState([])
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)

  const runTests = useCallback(async () => {
    if (addresses.length === 0 || running) return
    setRunning(true)
    setResults([])

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i].trim()
      if (!address) continue
      setCurrentIndex(i)

      // Autocomplete works like a search box — query with just the street part
      // e.g. "422 Flinders St, Manuka ACT 2603" → query "422 Flinders St"
      // Full address (with suburb/state) is only used for the validate call
      const streetPart = extractStreetPart(address)

      const result = {
        id: `${Date.now()}-${i}`,
        address,
        queryTerm: streetPart,
        timestamp: new Date().toISOString(),
        endpoints: {
          addressify: buildAddressifyAutocompleteUrl(streetPart, mode),
          kleber: buildKleberAutocompleteUrl(streetPart),
        },
        addressify: { status: 'loading', suggestions: [], info: null, error: null, durationMs: null },
        kleber: { status: 'loading', suggestions: [], info: null, error: null, durationMs: null },
      }

      // Update with loading state immediately
      setResults((prev) => [...prev, { ...result }])

      // --- Addressify ---
      const t0 = performance.now()
      try {
        const suggestions = await addressifyAutocomplete(streetPart, mode)
        let info = null
        let validationResult = null

        // suggestions are strings e.g. "500 GEORGE ST, SYDNEY NSW 2000"
        const firstSuggestion = Array.isArray(suggestions) ? suggestions[0] : null

        if (typeof firstSuggestion === 'string' && firstSuggestion.length > 0) {
          try {
            info = await addressifyInfo(firstSuggestion)
          } catch (_) {
            // info call optional
          }
        }

        // Validate against the full original address
        try {
          validationResult = await addressifyValidate(address)
        } catch (_) {
          // validate optional
        }

        result.addressify = {
          status: suggestions && suggestions.length > 0 ? 'found' : 'not_found',
          suggestions,
          info,
          validation: validationResult,
          error: null,
          durationMs: Math.round(performance.now() - t0),
        }
      } catch (err) {
        result.addressify = {
          status: 'error',
          suggestions: [],
          info: null,
          error: err.message,
          durationMs: Math.round(performance.now() - t0),
        }
      }

      await sleep(DELAY_MS)

      // --- Kleber ---
      const t1 = performance.now()
      try {
        const kleberResult = await kleberAutocomplete(streetPart)
        const records = kleberResult?.DtResponse?.Result || []
        let detail = null

        const firstRecord = records[0]
        if (firstRecord?.RecordId) {
          try {
            const detailResult = await kleberGetAddressDetails(firstRecord.RecordId)
            detail = detailResult?.DtResponse?.Result?.[0] || null
          } catch (_) {
            // detail optional
          }
        }

        result.kleber = {
          status: records.length > 0 ? 'found' : 'not_found',
          suggestions: records,
          info: detail,
          error: null,
          durationMs: Math.round(performance.now() - t1),
        }
      } catch (err) {
        result.kleber = {
          status: 'error',
          suggestions: [],
          info: null,
          error: err.message,
          durationMs: Math.round(performance.now() - t1),
        }
      }

      // Replace the loading entry with final result
      setResults((prev) => prev.map((r) => (r.id === result.id ? { ...result } : r)))

      await sleep(DELAY_MS)
    }

    setCurrentIndex(-1)
    setRunning(false)
  }, [addresses, mode, running])

  const clearAll = () => {
    setResults([])
    setAddresses([])
    setCurrentIndex(-1)
  }

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>Address API Tester</h1>
          <p style={styles.subtitle}>Compare Addressify vs Kleber for Australian address autocomplete</p>
          <nav style={styles.tabBar}>
            {[
              { key: 'batch', label: 'Batch Tester' },
              { key: 'live',  label: 'Live Demo' },
              { key: 'asic',  label: 'Address of ASIC' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === tab.key ? styles.tabBtnActive : {}),
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {activeTab === 'live' && <LiveDemo />}
      {activeTab === 'asic' && <AsicAddresses />}

      <main style={{ ...styles.main, display: activeTab === 'batch' ? 'block' : 'none' }}>
        {/* Mode toggle */}
        <div style={styles.card}>
          <div style={styles.modeRow}>
            <span style={styles.modeLabel}>Addressify Mode:</span>
            {['pro', 'lite'].map((m) => (
              <label key={m} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  style={{ marginRight: 4 }}
                />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Address input */}
        <AddressTextarea
          addresses={addresses}
          onChange={setAddresses}
          disabled={running}
        />

        {/* Controls */}
        <div style={styles.controlRow}>
          <button
            onClick={runTests}
            disabled={running || addresses.length === 0}
            style={{
              ...styles.btnPrimary,
              opacity: running || addresses.length === 0 ? 0.6 : 1,
              cursor: running || addresses.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? `Testing ${currentIndex + 1} / ${addresses.length}...` : `Run Tests (${addresses.length})`}
          </button>
          {results.length > 0 && !running && (
            <button onClick={clearAll} style={styles.btnSecondary}>
              Clear All
            </button>
          )}
        </div>

        {/* Progress bar */}
        {running && (
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.round(((currentIndex + 1) / addresses.length) * 100)}%`,
              }}
            />
          </div>
        )}

        {/* Report summary */}
        {results.length > 0 && <ReportPanel results={results} />}

        {/* Individual results */}
        {results.length > 0 && (
          <div style={styles.resultsSection}>
            <h2 style={styles.sectionTitle}>Results ({results.length})</h2>
            {results.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  root: { minHeight: '100vh', background: '#f5f7fa' },
  header: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
    padding: '24px 0',
    borderBottom: '3px solid #0f3460',
  },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px' },
  title: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 },
  subtitle: { margin: '6px 0 0', opacity: 0.7, fontSize: 14 },
  tabBar: { display: 'flex', gap: 4, marginTop: 20 },
  tabBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    letterSpacing: 0.2,
  },
  tabBtnActive: {
    color: '#fff',
    borderBottomColor: '#fff',
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '24px 24px 64px' },
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  modeRow: { display: 'flex', alignItems: 'center', gap: 16 },
  modeLabel: { fontWeight: 600, fontSize: 14, color: '#555' },
  radioLabel: { display: 'flex', alignItems: 'center', fontSize: 14, cursor: 'pointer' },
  controlRow: { display: 'flex', gap: 12, marginTop: 16, marginBottom: 16 },
  btnPrimary: {
    background: '#0f3460',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnSecondary: {
    background: '#fff',
    color: '#555',
    border: '1.5px solid #ddd',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 14,
    cursor: 'pointer',
  },
  progressBar: {
    height: 6,
    background: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #0f3460, #533483)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  resultsSection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' },
}
