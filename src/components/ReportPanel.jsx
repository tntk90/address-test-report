function avgMs(results, key) {
  const done = results.filter((r) => r[key].durationMs != null)
  if (done.length === 0) return null
  return Math.round(done.reduce((s, r) => s + r[key].durationMs, 0) / done.length)
}

function fmtMs(ms) {
  if (ms == null) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

export default function ReportPanel({ results }) {
  const total = results.length
  const addressifyHits = results.filter((r) => r.addressify.status === 'found').length
  const kleberHits = results.filter((r) => r.kleber.status === 'found').length
  const bothHit = results.filter(
    (r) => r.addressify.status === 'found' && r.kleber.status === 'found'
  ).length
  const neitherHit = results.filter(
    (r) => r.addressify.status !== 'found' && r.kleber.status !== 'found'
  ).length
  const addressifyErrors = results.filter((r) => r.addressify.status === 'error').length
  const kleberErrors = results.filter((r) => r.kleber.status === 'error').length
  const addrAvg = avgMs(results, 'addressify')
  const kleberAvg = avgMs(results, 'kleber')

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `address-test-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    const headers = [
      'Address',
      'Timestamp',
      'Addressify Status',
      'Addressify Suggestions Count',
      'Addressify Best Match',
      'Addressify Error',
      'Addressify Time (ms)',
      'Kleber Status',
      'Kleber Suggestions Count',
      'Kleber Best Match',
      'Kleber Error',
      'Kleber Time (ms)',
    ]

    const rows = results.map((r) => {
      const addrSuggestions = r.addressify.suggestions || []
      const kleberSuggestions = r.kleber.suggestions || []

      const addrBest =
        addrSuggestions[0]
          ? typeof addrSuggestions[0] === 'string'
            ? addrSuggestions[0]
            : addrSuggestions[0].AddressLine || addrSuggestions[0].FullAddress || ''
          : ''

      const kleberBest =
        kleberSuggestions[0]?.AddressLine || kleberSuggestions[0]?.FullAddress || ''

      return [
        r.address,
        r.timestamp,
        r.addressify.status,
        addrSuggestions.length,
        addrBest,
        r.addressify.error || '',
        r.addressify.durationMs ?? '',
        r.kleber.status,
        kleberSuggestions.length,
        kleberBest,
        r.kleber.error || '',
        r.kleber.durationMs ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
    })

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `address-test-report-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pct = (n) => (total === 0 ? '0' : Math.round((n / total) * 100))

  const stats = [
    { label: 'Total tested', value: total, color: '#1a1a2e' },
    { label: 'Addressify found', value: `${addressifyHits} (${pct(addressifyHits)}%)`, color: '#0f3460' },
    { label: 'Kleber found', value: `${kleberHits} (${pct(kleberHits)}%)`, color: '#533483' },
    { label: 'Both matched', value: `${bothHit} (${pct(bothHit)}%)`, color: '#166534' },
    { label: 'Neither matched', value: `${neitherHit} (${pct(neitherHit)}%)`, color: '#991b1b' },
    { label: 'Addressify errors', value: addressifyErrors, color: addressifyErrors > 0 ? '#dc2626' : '#888' },
    { label: 'Kleber errors', value: kleberErrors, color: kleberErrors > 0 ? '#dc2626' : '#888' },
    { label: 'Addressify avg time', value: fmtMs(addrAvg), color: '#0f3460' },
    { label: 'Kleber avg time', value: fmtMs(kleberAvg), color: '#533483' },
  ]

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Test Report Summary</h2>
        <div style={styles.btnGroup}>
          <button onClick={downloadJSON} style={styles.btn}>
            ↓ Download JSON
          </button>
          <button onClick={downloadCSV} style={styles.btn}>
            ↓ Download CSV
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Comparison bar */}
      <div style={styles.barSection}>
        <div style={styles.barLabel}>
          <span style={{ color: '#0f3460', fontWeight: 600 }}>Addressify</span>
          <span style={{ color: '#999' }}>vs</span>
          <span style={{ color: '#533483', fontWeight: 600 }}>Kleber</span>
        </div>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${pct(addressifyHits)}%`, background: '#0f3460' }} />
        </div>
        <div style={styles.barLabels}>
          <span>{pct(addressifyHits)}% match rate</span>
        </div>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${pct(kleberHits)}%`, background: '#533483' }} />
        </div>
        <div style={styles.barLabels}>
          <span>{pct(kleberHits)}% match rate</span>
        </div>
      </div>

      {/* Quick comparison table */}
      {results.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Address</th>
                <th style={{ ...styles.th, color: '#0f3460' }}>Addressify</th>
                <th style={{ ...styles.th, color: '#533483' }}>Kleber</th>
              </tr>

            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={{ ...styles.td, maxWidth: 300, wordBreak: 'break-word' }}>
                    {r.address}
                  </td>
                  <td style={styles.td}>
                    <StatusIcon status={r.addressify.status} />
                    {r.addressify.durationMs != null && (
                      <span style={styles.timeBadge}>{fmtMs(r.addressify.durationMs)}</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <StatusIcon status={r.kleber.status} />
                    {r.kleber.durationMs != null && (
                      <span style={styles.timeBadge}>{fmtMs(r.kleber.durationMs)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }) {
  const map = {
    loading: '⏳',
    found: '✅',
    not_found: '❌',
    error: '⚠️',
  }
  const labels = {
    loading: 'Testing',
    found: 'Found',
    not_found: 'No results',
    error: 'Error',
  }
  return (
    <span style={{ fontSize: 13 }}>
      {map[status] || '?'} {labels[status] || status}
    </span>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid #e8edf2',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  btnGroup: { display: 'flex', gap: 8 },
  btn: {
    background: '#f0f4ff',
    color: '#0f3460',
    border: '1.5px solid #c7d7f5',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: '#f8fafc',
    borderRadius: 8,
    padding: '12px',
    border: '1px solid #e8edf2',
    textAlign: 'center',
  },
  statValue: { fontSize: 22, fontWeight: 800, lineHeight: 1.2 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  barSection: { marginBottom: 8 },
  barLabel: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 13 },
  barTrack: {
    height: 10,
    background: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 5, transition: 'width 0.5s ease' },
  barLabels: { fontSize: 11, color: '#888', marginBottom: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '8px 12px',
    background: '#f1f5f9',
    fontWeight: 700,
    textAlign: 'left',
    borderBottom: '2px solid #e2e8f0',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: '#555',
  },
  td: { padding: '8px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
  timeBadge: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    background: '#f1f5f9',
    padding: '1px 6px',
    borderRadius: 4,
    whiteSpace: 'nowrap',
  },
}
