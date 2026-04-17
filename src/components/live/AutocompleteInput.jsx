import { useState, useEffect, useRef } from 'react'
import { addressifyAutocomplete } from '../../api/addressify'

function highlightMatch(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function AutocompleteInput({ mode, onSelect }) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const term = inputValue.trim()
    if (term.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await addressifyAutocomplete(term, mode)
        setSuggestions(Array.isArray(results) ? results : [])
        setOpen(true)
        setActiveIdx(-1)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [inputValue, mode])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (suggestion) => {
    setInputValue(suggestion)
    setOpen(false)
    setSuggestions([])
    onSelect(suggestion)
  }

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleClear = () => {
    setInputValue('')
    setSuggestions([])
    setOpen(false)
    onSelect(null)
  }

  return (
    <div ref={containerRef} style={styles.wrapper}>
      <div style={styles.inputRow}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type in an address line: e.g. 500 George st"
          style={styles.input}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span style={styles.spinner}>⏳</span>}
        {inputValue && !loading && (
          <button onClick={handleClear} style={styles.clearBtn} title="Clear">✕</button>
        )}
      </div>

      {open && (
        <ul style={styles.dropdown}>
          {suggestions.length === 0 ? (
            <li style={styles.noResults}>No results found</li>
          ) : (
            suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  ...styles.dropdownItem,
                  ...(i === activeIdx ? styles.dropdownItemActive : {}),
                }}
              >
                {highlightMatch(s, inputValue.trim())}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

const styles = {
  wrapper: { position: 'relative' },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #c8d6e5',
    borderRadius: 6,
    background: '#fff',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: '11px 14px',
    fontSize: 14,
    border: 'none',
    outline: 'none',
    color: '#1a1a2e',
    background: 'transparent',
  },
  spinner: { padding: '0 10px', fontSize: 14 },
  clearBtn: {
    background: 'none',
    border: 'none',
    padding: '0 12px',
    fontSize: 14,
    color: '#aaa',
    cursor: 'pointer',
    lineHeight: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 2px)',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1.5px solid #c8d6e5',
    borderRadius: 6,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 100,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    maxHeight: 280,
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '10px 14px',
    fontSize: 13,
    color: '#1a1a2e',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    lineHeight: 1.4,
  },
  dropdownItemActive: {
    background: '#f0f4ff',
    color: '#0f3460',
  },
  noResults: {
    padding: '12px 14px',
    fontSize: 13,
    color: '#aaa',
    fontStyle: 'italic',
  },
}
