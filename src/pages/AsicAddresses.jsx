import { useState, useEffect, useMemo } from 'react'
import { loadAsicAddresses } from '../utils/asicParser'

const PAGE_SIZE = 50

const STATE_COLORS = {
  NSW: { bg: '#dbeafe', text: '#1e40af' },
  VIC: { bg: '#dcfce7', text: '#166534' },
  QLD: { bg: '#fef9c3', text: '#854d0e' },
  WA:  { bg: '#fae8ff', text: '#7e22ce' },
  SA:  { bg: '#ffedd5', text: '#9a3412' },
  ACT: { bg: '#e0f2fe', text: '#0369a1' },
  TAS: { bg: '#f0fdf4', text: '#14532d' },
  NT:  { bg: '#fff7ed', text: '#c2410c' },
}

function StateChip({ state, count }) {
  const color = STATE_COLORS[state] || { bg: '#f1f5f9', text: '#475569' }
  return (
    <span style={{ ...styles.chip, background: color.bg, color: color.text }}>
      {state} <strong>{count.toLocaleString()}</strong>
    </span>
  )
}

function SkeletonRows() {
  return Array.from({ length: 10 }, (_, i) => (
    <tr key={i}>
      {Array.from({ length: 7 }, (__, j) => (
        <td key={j} style={styles.td}>
          <div style={{ ...styles.skeleton, width: j === 1 ? '90%' : '60%' }} />
        </td>
      ))}
    </tr>
  ))
}

export default function AsicAddresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)

  useEffect(() => {
    loadAsicAddresses()
      .then((data) => { setAddresses(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  // State breakdown
  const stateCounts = useMemo(() => {
    const map = {}
    for (const a of addresses) {
      const s = a.state || 'Other'
      map[s] = (map[s] || 0) + 1
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [addresses])

  // Filtered list
  const filtered = useMemo(() => {
    if (!search.trim()) return addresses
    const q = search.trim().toLowerCase()
    return addresses.filter(
      (a) =>
        a.formattedAddress.toLowerCase().includes(q) ||
        a.suburb.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
    )
  }, [addresses, search])

  // Reset to page 1 on search change
  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* Stats header */}
        <div style={styles.statsCard}>
          <div style={styles.statsRow}>
            <span style={styles.totalLabel}>
              {loading ? 'Loading…' : `${addresses.length.toLocaleString()} addresses`}
            </span>
            <span style={styles.sourceHint}>from tbl_asic_log.csv</span>
          </div>
          {!loading && !error && (
            <div style={styles.chipRow}>
              {stateCounts.map(([state, count]) => (
                <StateChip key={state} state={state} count={count} />
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span> Failed to load addresses: {error}
          </div>
        )}

        {/* Search */}
        {!error && (
          <div style={styles.searchCard}>
            <div style={styles.searchRow}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by address, suburb, or state…"
                style={styles.searchInput}
                disabled={loading}
              />
              {search && (
                <button onClick={() => setSearch('')} style={styles.clearBtn} title="Clear">✕</button>
              )}
            </div>
            {search && !loading && (
              <p style={styles.searchHint}>
                {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        )}

        {/* Table */}
        {!error && (
          <div style={styles.tableCard}>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 50 }}>#</th>
                    <th style={{ ...styles.th, minWidth: 260 }}>Full Address</th>
                    <th style={{ ...styles.th, width: 110 }}>Unit / Floor</th>
                    <th style={{ ...styles.th, minWidth: 180 }}>Street</th>
                    <th style={{ ...styles.th, minWidth: 130 }}>Suburb</th>
                    <th style={{ ...styles.th, width: 55 }}>State</th>
                    <th style={{ ...styles.th, width: 70 }}>Postcode</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows />
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.emptyCell}>No addresses found.</td>
                    </tr>
                  ) : (
                    pageItems.map((a, i) => {
                      const rowNum = (safePage - 1) * PAGE_SIZE + i + 1
                      const stateColor = STATE_COLORS[a.state] || {}
                      const unitDisplay = [a.floor, a.unit].filter(Boolean).join(' / ')
                      const streetDisplay = [a.streetNumber, a.streetName, a.streetType]
                        .filter(Boolean).join(' ')
                      return (
                        <tr
                          key={`${a.rowId}-${i}`}
                          style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}
                        >
                          <td style={{ ...styles.td, ...styles.tdNum }}>{rowNum}</td>
                          <td style={{ ...styles.td, ...styles.tdAddr }}>{a.formattedAddress}</td>
                          <td style={{ ...styles.td, color: unitDisplay ? '#1a1a2e' : '#cbd5e1' }}>
                            {unitDisplay || '—'}
                          </td>
                          <td style={styles.td}>{streetDisplay || '—'}</td>
                          <td style={styles.td}>{a.suburb || '—'}</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {a.state ? (
                              <span style={{
                                ...styles.stateBadge,
                                background: stateColor.bg || '#f1f5f9',
                                color: stateColor.text || '#475569',
                              }}>
                                {a.state}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>{a.postcode || '—'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  style={{ ...styles.pageBtn, opacity: safePage === 1 ? 0.4 : 1 }}
                >
                  ← Prev
                </button>
                <span style={styles.pageInfo}>
                  Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
                  <span style={styles.pageCount}>
                    ({filtered.length.toLocaleString()} total)
                  </span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  style={{ ...styles.pageBtn, opacity: safePage === totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { background: '#f5f7fa', minHeight: 'calc(100vh - 120px)', padding: '24px 0 64px' },
  inner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px' },

  statsCard: {
    background: '#fff',
    borderRadius: 10,
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: 16,
    borderLeft: '4px solid #0f3460',
  },
  statsRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  totalLabel: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  sourceHint: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },

  errorBox: {
    display: 'flex',
    gap: 8,
    fontSize: 13,
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 16,
  },

  searchCard: {
    background: '#fff',
    borderRadius: 10,
    padding: '14px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #c8d6e5',
    borderRadius: 6,
    overflow: 'hidden',
    background: '#fff',
  },
  searchIcon: { padding: '0 10px', fontSize: 14, userSelect: 'none' },
  searchInput: {
    flex: 1,
    padding: '10px 4px',
    fontSize: 14,
    border: 'none',
    outline: 'none',
    color: '#1a1a2e',
    background: 'transparent',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    padding: '0 12px',
    fontSize: 14,
    color: '#aaa',
    cursor: 'pointer',
  },
  searchHint: { margin: '8px 0 0', fontSize: 12, color: '#64748b' },

  tableCard: {
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#475569',
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '9px 12px',
    color: '#374151',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
    fontSize: 13,
  },
  tdNum: { color: '#94a3b8', fontVariantNumeric: 'tabular-nums', textAlign: 'right', paddingRight: 16 },
  tdAddr: { fontWeight: 500, color: '#1a1a2e' },
  stateBadge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 4,
  },
  emptyCell: { textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 14 },
  skeleton: {
    height: 14,
    borderRadius: 4,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s infinite',
  },

  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '14px 20px',
    borderTop: '1px solid #e2e8f0',
  },
  pageBtn: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 6,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#0f3460',
    transition: 'background 0.15s',
  },
  pageInfo: { fontSize: 13, color: '#475569' },
  pageCount: { marginLeft: 8, fontSize: 12, color: '#94a3b8' },
}
