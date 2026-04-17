// Normalise a raw info object (Addressify or Kleber) into a common shape
function normalise(info, source) {
  if (!info) return null
  if (source === 'addressify') {
    const suburb  = info.Suburb   || ''
    const state   = info.State    || ''
    const postcode = info.Postcode || ''
    return {
      streetNumber : info.Number        || info.SubNumber || '',
      streetName   : info.Street        || '',
      streetType   : info.StreetType    || '',
      streetSuffix : info.StreetSuffix  || '',
      addressLine  : info.StreetLine    || info.AddressLine2 || '',
      suburb,
      state,
      postcode,
      suburbStatePc: [suburb, state, postcode].filter(Boolean).join(' '),
    }
  }
  // Kleber (RetrieveAddress response)
  const suburb   = info.Locality  || ''
  const state    = info.State     || ''
  const postcode = info.Postcode  || ''
  return {
    streetNumber : info.StreetNumber1 || '',
    streetName   : info.StreetName    || '',
    streetType   : info.StreetType    || '',
    streetSuffix : info.StreetSuffix  || '',
    addressLine  : info.AddressLine   || '',
    suburb,
    state,
    postcode,
    suburbStatePc: [suburb, state, postcode].filter(Boolean).join(' '),
  }
}

const FIELDS = [
  { label: 'Street Number', key: 'streetNumber' },
  { label: 'Street Name',   key: 'streetName'   },
  { label: 'Street Type',   key: 'streetType'   },
  { label: 'Street Suffix', key: 'streetSuffix' },
  { label: 'Address Line',  key: 'addressLine'  },
  { label: 'Suburb',        key: 'suburb'       },
  { label: 'State',         key: 'state'        },
  { label: 'Postcode',      key: 'postcode'     },
  { label: 'Suburb, State, Postcode', key: 'suburbStatePc' },
]

function SkeletonField() {
  return <div style={styles.skeleton} />
}

export default function AddressFieldsPanel({ title, accentColor, source, info, loading, errorMessage }) {
  const data = normalise(info, source)

  return (
    <div style={styles.panel}>
      {/* Panel header */}
      <div style={{ ...styles.panelHeader, borderLeftColor: accentColor }}>
        <span style={{ ...styles.panelTitle, color: accentColor }}>{title}</span>
        {info && !loading && (
          <span style={{
            ...styles.validBadge,
            background: info.Valid !== false ? '#dcfce7' : '#fee2e2',
            color:      info.Valid !== false ? '#166534' : '#991b1b',
          }}>
            {info.Valid !== false ? '✅ Valid' : '❌ Invalid'}
          </span>
        )}
      </div>

      {/* Error state */}
      {errorMessage && (
        <div style={styles.errorBox}>
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* Fields */}
      <div style={styles.fields}>
        {FIELDS.map(({ label, key }) => (
          <div key={key} style={styles.fieldRow}>
            <label style={styles.fieldLabel}>{label}</label>
            {loading ? (
              <SkeletonField />
            ) : (
              <input
                type="text"
                readOnly
                value={data ? (data[key] || '') : ''}
                placeholder={data ? '' : '—'}
                style={{
                  ...styles.fieldInput,
                  background: data?.[key] ? '#fff' : '#f8fafc',
                  color: data?.[key] ? '#1a1a2e' : '#aaa',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  panel: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderLeft: '4px solid',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  panelTitle: { fontWeight: 700, fontSize: 15 },
  validBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
  },
  errorBox: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 12,
    color: '#dc2626',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    margin: '12px 16px',
    padding: '8px 12px',
    borderRadius: 6,
  },
  fields: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  fieldRow: { display: 'flex', flexDirection: 'column', gap: 3 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: {
    padding: '8px 10px',
    fontSize: 13,
    border: '1.5px solid #e2e8f0',
    borderRadius: 6,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'default',
  },
  skeleton: {
    height: 34,
    borderRadius: 6,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s infinite',
  },
}
