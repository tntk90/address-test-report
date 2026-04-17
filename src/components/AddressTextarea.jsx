import { useState, useMemo } from 'react'
import { loadAsicAddresses } from '../utils/asicParser'

const STREETS = [
  ['George', 'St'], ['Queen', 'St'], ['King', 'St'], ['Elizabeth', 'St'], ['William', 'St'],
  ['Collins', 'St'], ['Spencer', 'St'], ['Bourke', 'St'], ['Flinders', 'St'], ['Swanston', 'St'],
  ['Ann', 'St'], ['Adelaide', 'St'], ['Edward', 'St'], ['Mary', 'St'], ['Margaret', 'St'],
  ['Pitt', 'St'], ['Castlereagh', 'St'], ['Kent', 'St'], ['York', 'St'], ['Clarence', 'St'],
  ['Pacific', 'Hwy'], ['Victoria', 'Ave'], ['Church', 'St'], ['Station', 'St'], ['High', 'St'],
  ['Bridge', 'Rd'], ['Main', 'Rd'], ['Military', 'Rd'], ['Crown', 'St'], ['Oxford', 'St'],
  ['Anzac', 'Pde'], ['Parramatta', 'Rd'], ['Old', 'Rd'], ['New', 'Rd'], ['North', 'Rd'],
  ['South', 'Rd'], ['East', 'Ave'], ['West', 'Ave'], ['Park', 'Rd'], ['Garden', 'St'],
  ['Hill', 'St'], ['Lake', 'Rd'], ['River', 'Rd'], ['Forest', 'Way'], ['Ocean', 'Dr'],
  ['Bay', 'Rd'], ['Beach', 'Rd'], ['Coast', 'Dr'], ['Valley', 'Rd'], ['Mount', 'Rd'],
]

const SUBURBS = [
  ['Sydney', 'NSW', '2000'], ['Melbourne', 'VIC', '3000'], ['Brisbane', 'QLD', '4000'],
  ['Perth', 'WA', '6000'], ['Adelaide', 'SA', '5000'], ['Canberra', 'ACT', '2600'],
  ['Hobart', 'TAS', '7000'], ['Darwin', 'NT', '0800'], ['Parramatta', 'NSW', '2150'],
  ['Chatswood', 'NSW', '2067'], ['Bondi', 'NSW', '2026'], ['Manly', 'NSW', '2095'],
  ['Newtown', 'NSW', '2042'], ['Surry Hills', 'NSW', '2010'], ['Glebe', 'NSW', '2037'],
  ['Pyrmont', 'NSW', '2009'], ['Darlinghurst', 'NSW', '2010'], ['Rozelle', 'NSW', '2039'],
  ['Balmain', 'NSW', '2041'], ['Leichhardt', 'NSW', '2040'], ['Marrickville', 'NSW', '2204'],
  ['Richmond', 'VIC', '3121'], ['Fitzroy', 'VIC', '3065'], ['Collingwood', 'VIC', '3066'],
  ['Prahran', 'VIC', '3181'], ['St Kilda', 'VIC', '3182'], ['Northcote', 'VIC', '3070'],
  ['Brunswick', 'VIC', '3056'], ['Footscray', 'VIC', '3011'], ['Williamstown', 'VIC', '3016'],
  ['South Yarra', 'VIC', '3141'], ['Toorak', 'VIC', '3142'], ['Hawthorn', 'VIC', '3122'],
  ['Fortitude Valley', 'QLD', '4006'], ['South Brisbane', 'QLD', '4101'], ['West End', 'QLD', '4101'],
  ['Paddington', 'QLD', '4064'], ['Toowong', 'QLD', '4066'], ['Auchenflower', 'QLD', '4066'],
  ['Woolloongabba', 'QLD', '4102'], ['Kangaroo Point', 'QLD', '4169'], ['New Farm', 'QLD', '4005'],
  ['Subiaco', 'WA', '6008'], ['Fremantle', 'WA', '6160'], ['Cottesloe', 'WA', '6011'],
  ['Leederville', 'WA', '6007'], ['Mount Lawley', 'WA', '6050'], ['Nedlands', 'WA', '6009'],
  ['Unley', 'SA', '5061'], ['Norwood', 'SA', '5067'], ['Prospect', 'SA', '5082'],
  ['Glenelg', 'SA', '5045'], ['Burnside', 'SA', '5066'], ['Mitcham', 'SA', '5062'],
  ['Civic', 'ACT', '2601'], ['Braddon', 'ACT', '2612'], ['Manuka', 'ACT', '2603'],
  ['Kingston', 'ACT', '2604'], ['Griffith', 'ACT', '2603'], ['Yarralumla', 'ACT', '2600'],
  ['Sandy Bay', 'TAS', '7005'], ['Battery Point', 'TAS', '7004'], ['North Hobart', 'TAS', '7000'],
  ['Fannie Bay', 'NT', '0820'], ['Parap', 'NT', '0820'], ['Stuart Park', 'NT', '0820'],
  ['Oakleigh', 'VIC', '3166'], ['Box Hill', 'VIC', '3128'], ['Ringwood', 'VIC', '3134'],
  ['Camberwell', 'VIC', '3124'], ['Malvern', 'VIC', '3144'], ['Glen Waverley', 'VIC', '3150'],
  ['Bankstown', 'NSW', '2200'], ['Liverpool', 'NSW', '2170'], ['Penrith', 'NSW', '2750'],
  ['Campbelltown', 'NSW', '2560'], ['Wollongong', 'NSW', '2500'], ['Newcastle', 'NSW', '2300'],
  ['Gosford', 'NSW', '2250'], ['Maitland', 'NSW', '2320'], ['Tamworth', 'NSW', '2340'],
  ['Townsville', 'QLD', '4810'], ['Cairns', 'QLD', '4870'], ['Gold Coast', 'QLD', '4217'],
  ['Sunshine Coast', 'QLD', '4558'], ['Toowoomba', 'QLD', '4350'], ['Rockhampton', 'QLD', '4700'],
  ['Ballarat', 'VIC', '3350'], ['Geelong', 'VIC', '3220'], ['Bendigo', 'VIC', '3550'],
  ['Albury', 'NSW', '2640'], ['Wagga Wagga', 'NSW', '2650'], ['Orange', 'NSW', '2800'],
  ['Bunbury', 'WA', '6230'], ['Geraldton', 'WA', '6530'], ['Mandurah', 'WA', '6210'],
  ['Mount Gambier', 'SA', '5290'], ['Whyalla', 'SA', '5600'], ['Port Augusta', 'SA', '5700'],
  ['Launceston', 'TAS', '7250'], ['Devonport', 'TAS', '7310'], ['Burnie', 'TAS', '7320'],
  ['Alice Springs', 'NT', '0870'], ['Katherine', 'NT', '0850'], ['Palmerston', 'NT', '0830'],
  ['Hammond Park', 'WA', '6164'], ['Dural', 'NSW', '2158'], ['Pimpama', 'QLD', '4209'],
  ['Regency Park', 'SA', '5010'], ['Cornubia', 'QLD', '4130'], ['Glenvale', 'QLD', '4350'],
]

function generateSamples(count) {
  const results = []
  // Seed a deterministic sequence so samples are stable across renders
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return Math.abs(seed) / 0x7fffffff
  }

  for (let i = 0; i < count; i++) {
    const [suburb, state, postcode] = SUBURBS[Math.floor(rand() * SUBURBS.length)]
    const [streetName, streetType] = STREETS[Math.floor(rand() * STREETS.length)]
    const number = Math.floor(rand() * 499) + 1
    results.push(`${number} ${streetName} ${streetType}, ${suburb} ${state} ${postcode}`)
  }
  return results
}

export default function AddressTextarea({ addresses, onChange, disabled }) {
  const [sampleCount, setSampleCount] = useState(10)
  const [asicLoading, setAsicLoading] = useState(false)

  const handleLoadAsic = async () => {
    setAsicLoading(true)
    try {
      const all = await loadAsicAddresses()
      const count = Math.min(Math.max(1, Number(sampleCount) || 1), all.length)
      onChange(all.slice(0, count).map((a) => a.formattedAddress))
    } finally {
      setAsicLoading(false)
    }
  }

  const text = addresses.join('\n')

  // Pre-generate max pool once
  const samplePool = useMemo(() => generateSamples(500), [])

  const handleChange = (e) => {
    const lines = e.target.value.split('\n').map((l) => l.trimEnd())
    onChange(lines.filter((l) => l.length > 0))
  }

  const loadSamples = () => {
    const count = Math.min(Math.max(1, Number(sampleCount) || 1), 500)
    onChange(samplePool.slice(0, count))
  }

  const handleCountChange = (e) => {
    const val = e.target.value
    if (val === '') { setSampleCount(''); return }
    const n = parseInt(val, 10)
    if (!isNaN(n)) setSampleCount(n)
  }

  const handleCountBlur = () => {
    const n = Number(sampleCount)
    if (!n || n < 1) setSampleCount(1)
    else if (n > 500) setSampleCount(500)
  }

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>Test Addresses</h3>
          <p style={styles.hint}>Enter one address per line</p>
        </div>
        <div style={styles.sampleControls}>
          <label style={styles.countLabel}>
            Sample count:
            <input
              type="number"
              min={1}
              max={500}
              value={sampleCount}
              onChange={handleCountChange}
              onBlur={handleCountBlur}
              disabled={disabled}
              style={{ ...styles.countInput, opacity: disabled ? 0.5 : 1 }}
            />
            <span style={styles.maxHint}>/ 500</span>
          </label>
          <button
            onClick={loadSamples}
            disabled={disabled}
            style={{ ...styles.samplesBtn, opacity: disabled ? 0.5 : 1 }}
          >
            Load samples
          </button>
          <button
            onClick={handleLoadAsic}
            disabled={disabled || asicLoading}
            style={{ ...styles.samplesBtn, ...styles.asicBtn, opacity: disabled || asicLoading ? 0.5 : 1 }}
          >
            {asicLoading ? 'Loading…' : 'Load ASIC Address'}
          </button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        disabled={disabled}
        placeholder={
          '500 George St, Sydney NSW 2000\n1 Martin Place, Sydney NSW 2000\n100 Queen St, Melbourne VIC 3000\n...'
        }
        rows={8}
        style={{
          ...styles.textarea,
          background: disabled ? '#fafafa' : '#fff',
        }}
      />
      <div style={styles.footer}>
        <span style={styles.count}>
          {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
        </span>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  hint: { margin: '4px 0 0', fontSize: 12, color: '#888' },
  sampleControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  countLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#555',
    fontWeight: 600,
  },
  countInput: {
    width: 70,
    padding: '6px 8px',
    fontSize: 13,
    border: '1.5px solid #e2e8f0',
    borderRadius: 6,
    outline: 'none',
    textAlign: 'center',
    color: '#1a1a2e',
  },
  maxHint: { fontSize: 12, color: '#aaa', fontWeight: 400 },
  samplesBtn: {
    background: '#f0f4ff',
    color: '#0f3460',
    border: '1.5px solid #c7d7f5',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  asicBtn: {
    background: '#f5f0ff',
    color: '#533483',
    border: '1.5px solid #d4bbf5',
  },
  textarea: {
    width: '100%',
    resize: 'vertical',
    padding: '12px',
    fontSize: 13,
    fontFamily: 'monospace',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    outline: 'none',
    color: '#1a1a2e',
    lineHeight: 1.6,
  },
  footer: { marginTop: 8, display: 'flex', justifyContent: 'flex-end' },
  count: { fontSize: 12, color: '#999' },
}
