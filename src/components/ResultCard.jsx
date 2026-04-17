import { useState } from 'react'

function StatusBadge({ status }) {
  const map = {
    loading: { label: 'Testing...', bg: '#fef9c3', color: '#92400e' },
    found: { label: 'Found', bg: '#dcfce7', color: '#166534' },
    not_found: { label: 'No Results', bg: '#fee2e2', color: '#991b1b' },
    error: { label: 'API Error', bg: '#fce7f3', color: '#9d174d' },
  }
  const s = map[status] || map.error
  return (
    <span style={{ ...styles.badge, background: s.bg, color: s.color }}>
      {status === 'loading' ? '⏳' : status === 'found' ? '✅' : status === 'not_found' ? '❌' : '⚠️'} {s.label}
    </span>
  )
}

function SuggestionList({ items, type }) {
  if (!items || items.length === 0) return <p style={styles.empty}>No suggestions returned.</p>

  if (type === 'addressify') {
    return (
      <ul style={styles.list}>
        {items.slice(0, 5).map((item, i) => (
          <li key={i} style={styles.listItem}>
            {typeof item === 'string' ? item : item.AddressLine || item.FullAddress || JSON.stringify(item)}
          </li>
        ))}
        {items.length > 5 && (
          <li style={{ ...styles.listItem, color: '#999', fontStyle: 'italic' }}>
            +{items.length - 5} more
          </li>
        )}
      </ul>
    )
  }

  // Kleber
  return (
    <ul style={styles.list}>
      {items.slice(0, 5).map((item, i) => (
        <li key={i} style={styles.listItem}>
          {item.AddressLine || item.FullAddress || JSON.stringify(item)}
        </li>
      ))}
      {items.length > 5 && (
        <li style={{ ...styles.listItem, color: '#999', fontStyle: 'italic' }}>
          +{items.length - 5} more
        </li>
      )}
    </ul>
  )
}

function InfoBlock({ info, type }) {
  if (!info) return <p style={styles.empty}>No detail record.</p>

  let fields = []

  if (type === 'addressify') {
    const keys = [
      'FullAddress', 'AddressLine', 'SubNumber', 'StreetNumber', 'StreetName',
      'StreetType', 'Locality', 'State', 'Postcode', 'Dpid', 'Longitude', 'Latitude',
    ]
    keys.forEach((k) => {
      if (info[k] !== undefined && info[k] !== null && info[k] !== '') {
        fields.push({ key: k, value: String(info[k]) })
      }
    })
    // fallback for unknown structure
    if (fields.length === 0) {
      fields = Object.entries(info).map(([k, v]) => ({ key: k, value: String(v) }))
    }
  } else {
    // Kleber
    fields = Object.entries(info)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => ({ key: k, value: String(v) }))
  }

  return (
    <table style={styles.table}>
      <tbody>
        {fields.map(({ key, value }) => (
          <tr key={key}>
            <td style={styles.tdKey}>{key}</td>
            <td style={styles.tdVal}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ValidationBlock({ validation }) {
  if (!validation) return null
  const isValid = validation?.IsValid ?? validation?.isValid
  return (
    <div style={{ marginTop: 8 }}>
      <span style={{
        ...styles.badge,
        background: isValid ? '#dcfce7' : '#fee2e2',
        color: isValid ? '#166534' : '#991b1b',
      }}>
        {isValid ? '✅ Valid address' : '❌ Invalid address'}
      </span>
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy} style={{ ...styles.copyBtn, ...(copied ? styles.copyBtnDone : {}) }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function EndpointRow({ label, color, url }) {
  return (
    <div style={styles.endpointRow}>
      <span style={{ ...styles.endpointLabel, background: color.bg, color: color.text }}>
        {label}
      </span>
      <code style={styles.endpointUrl}>{url}</code>
      <CopyButton text={url} />
    </div>
  )
}

export default function ResultCard({ result }) {
  const [expanded, setExpanded] = useState(true)
  const [rawTab, setRawTab] = useState(null) // 'addressify' | 'kleber' | null

  const isLoading = result.addressify.status === 'loading' || result.kleber.status === 'loading'

  return (
    <div style={{ ...styles.card, opacity: isLoading ? 0.8 : 1 }}>
      {/* Header */}
      <div style={styles.cardHeader} onClick={() => setExpanded((e) => !e)}>
        <div style={styles.addressRow}>
          <span style={styles.addressText}>{result.address}</span>
          <span style={styles.timestamp}>{new Date(result.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style={styles.badgeRow}>
          <span style={styles.apiLabel}>Addressify:</span>
          <StatusBadge status={result.addressify.status} />
          <span style={{ ...styles.apiLabel, marginLeft: 12 }}>Kleber:</span>
          <StatusBadge status={result.kleber.status} />
          <span style={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={styles.body}>
          {/* Endpoint URLs */}
          {result.endpoints && (
            <div style={styles.endpointsBlock}>
              <div style={styles.endpointsTitle}>
                <span style={styles.endpointsTitleIcon}>🔗</span>
                Autocomplete endpoints
                {result.queryTerm && result.queryTerm !== result.address && (
                  <span style={styles.endpointQueryHint}>
                    queried as <code style={styles.inlineCode}>{result.queryTerm}</code>
                  </span>
                )}
              </div>
              <EndpointRow
                label="Addressify"
                color={{ bg: '#e0f0ff', text: '#0f3460' }}
                url={result.endpoints.addressify}
              />
              <EndpointRow
                label="Kleber"
                color={{ bg: '#ede9f8', text: '#533483' }}
                url={result.endpoints.kleber}
              />
            </div>
          )}

          <div style={styles.grid}>
            {/* Addressify column */}
            <div style={styles.col}>
              <div style={styles.colHeader}>
                <strong style={{ color: '#0f3460' }}>Addressify</strong>
                <button
                  style={styles.rawBtn}
                  onClick={() => setRawTab(rawTab === 'addressify' ? null : 'addressify')}
                >
                  {rawTab === 'addressify' ? 'Hide Raw' : 'Raw JSON'}
                </button>
              </div>
              {result.addressify.error ? (
                <div style={styles.errorBox}>
                  <span style={styles.errorIcon}>⚠️</span>
                  <span>{result.addressify.error}</span>
                </div>
              ) : (
                <>
                  <p style={styles.sectionLabel}>Suggestions ({result.addressify.suggestions.length})</p>
                  <SuggestionList items={result.addressify.suggestions} type="addressify" />
                  {result.addressify.validation && (
                    <ValidationBlock validation={result.addressify.validation} />
                  )}
                  {result.addressify.info && (
                    <>
                      <p style={styles.sectionLabel}>Best Match Details</p>
                      <InfoBlock info={result.addressify.info} type="addressify" />
                    </>
                  )}
                  {rawTab === 'addressify' && (
                    <pre style={styles.raw}>{JSON.stringify(result.addressify, null, 2)}</pre>
                  )}
                </>
              )}
            </div>

            {/* Kleber column */}
            <div style={styles.col}>
              <div style={styles.colHeader}>
                <strong style={{ color: '#533483' }}>Kleber</strong>
                <button
                  style={styles.rawBtn}
                  onClick={() => setRawTab(rawTab === 'kleber' ? null : 'kleber')}
                >
                  {rawTab === 'kleber' ? 'Hide Raw' : 'Raw JSON'}
                </button>
              </div>
              {result.kleber.error ? (
                <div style={styles.errorBox}>
                  <span style={styles.errorIcon}>⚠️</span>
                  <span>{result.kleber.error}</span>
                </div>
              ) : (
                <>
                  <p style={styles.sectionLabel}>Suggestions ({result.kleber.suggestions.length})</p>
                  <SuggestionList items={result.kleber.suggestions} type="kleber" />
                  {result.kleber.info && (
                    <>
                      <p style={styles.sectionLabel}>Best Match Details</p>
                      <InfoBlock info={result.kleber.info} type="kleber" />
                    </>
                  )}
                  {rawTab === 'kleber' && (
                    <pre style={styles.raw}>{JSON.stringify(result.kleber, null, 2)}</pre>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    border: '1px solid #e8edf2',
  },
  cardHeader: {
    padding: '14px 20px',
    cursor: 'pointer',
    background: '#f8fafc',
    borderBottom: '1px solid #e8edf2',
    userSelect: 'none',
  },
  addressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressText: { fontWeight: 700, fontSize: 15, color: '#1a1a2e' },
  timestamp: { fontSize: 11, color: '#aaa' },
  badgeRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  apiLabel: { fontSize: 13, color: '#666', fontWeight: 600 },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  chevron: { marginLeft: 'auto', fontSize: 12, color: '#999' },
  body: { padding: '16px 20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  col: {
    background: '#fafbfc',
    borderRadius: 8,
    padding: '14px',
    border: '1px solid #e8edf2',
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rawBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    cursor: 'pointer',
    color: '#666',
  },
  sectionLabel: {
    margin: '12px 0 4px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#888',
  },
  list: { margin: 0, padding: '0 0 0 16px' },
  listItem: { fontSize: 13, color: '#374151', padding: '2px 0', lineHeight: 1.5 },
  empty: { fontSize: 13, color: '#aaa', margin: '4px 0' },
  errorBox: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 13,
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '10px 12px',
    borderRadius: 6,
    lineHeight: 1.5,
  },
  errorIcon: { flexShrink: 0, fontSize: 14 },
  endpointsBlock: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 16,
  },
  endpointsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  endpointsTitleIcon: { fontSize: 13 },
  endpointQueryHint: {
    fontWeight: 400,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#94a3b8',
    marginLeft: 4,
  },
  inlineCode: {
    background: '#e2e8f0',
    padding: '1px 5px',
    borderRadius: 3,
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#334155',
  },
  endpointRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    borderTop: '1px solid #f1f5f9',
  },
  endpointLabel: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
    minWidth: 76,
    textAlign: 'center',
  },
  endpointUrl: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#334155',
    background: 'transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  },
  copyBtn: {
    flexShrink: 0,
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.15s',
  },
  copyBtnDone: {
    background: '#f0fdf4',
    borderColor: '#86efac',
    color: '#16a34a',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  tdKey: {
    padding: '3px 8px 3px 0',
    color: '#666',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    verticalAlign: 'top',
    width: '40%',
  },
  tdVal: { padding: '3px 0', color: '#1a1a2e', wordBreak: 'break-word' },
  raw: {
    background: '#1a1a2e',
    color: '#a8ff78',
    padding: 10,
    borderRadius: 6,
    fontSize: 11,
    overflow: 'auto',
    maxHeight: 300,
    marginTop: 8,
  },
}
