/**
 * Customer-facing tracking page (read-only).
 * Uses uncontrolled input so typing is never blocked by React state.
 */
import { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shipments } from '../api/client.js';
import { usePoll } from '../hooks/usePoll.js';
import { ShipmentMap } from '../components/ShipmentMap.jsx';
import { ShipmentCard } from '../components/ShipmentCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const POLL_MS = 2 * 60 * 1000;

export function TrackPage() {
  const { shipmentNumber } = useParams();
  const inputRef = useRef(null);
  const [searchNumber, setSearchNumber] = useState(shipmentNumber || '');

  const fetcher = () =>
    searchNumber ? shipments.getByNumber(searchNumber) : Promise.resolve(null);
  const { data: shipment, loading, error, refresh } = usePoll(fetcher, POLL_MS);

  useEffect(() => {
    if (searchNumber) refresh();
  }, [searchNumber, refresh]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = inputRef.current ? inputRef.current.value.trim() : '';
    setSearchNumber(value);
  };

  const fillDemo = () => {
    if (inputRef.current) {
      inputRef.current.value = 'SHP-DEMO-001';
      setSearchNumber('SHP-DEMO-001');
    }
  };

  useEffect(() => {
    if (shipmentNumber && inputRef.current) {
      inputRef.current.value = shipmentNumber;
      setSearchNumber(shipmentNumber);
    }
  }, [shipmentNumber]);

  const historyFetcher = () =>
    searchNumber && shipment ? shipments.getHistory(searchNumber) : Promise.resolve([]);
  const { data: history = [], refresh: refreshHistory } = usePoll(historyFetcher, POLL_MS);

  useEffect(() => {
    if (searchNumber && shipment) refreshHistory();
  }, [searchNumber, shipment, refreshHistory]);

  return (
    <div className="page-container">
      <nav style={{ marginBottom: 24 }}>
        <Link to="/" style={{ color: 'var(--tagline-yellow)' }}>← Home</Link>
      </nav>

      <h1 style={{ marginBottom: 8, fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', color: 'var(--text-on-dark)' }}>Track Shipment</h1>
      <p style={{ color: 'var(--text-muted-dark)', marginBottom: 24, fontSize: '0.95rem' }}>
        Enter your shipment number below. Or{' '}
        <button type="button" onClick={fillDemo} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--tagline-yellow)', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>
          load demo: SHP-DEMO-001
        </button>
      </p>

      <form onSubmit={handleSearch} className="track-form">
        <input
          ref={inputRef}
          type="text"
          defaultValue={shipmentNumber || ''}
          placeholder="e.g. SHP-DEMO-001"
          autoComplete="off"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px 16px',
            border: '2px solid var(--theme-dark-border)',
            borderRadius: 8,
            fontSize: 16,
            background: 'var(--theme-dark-card)',
            color: 'var(--text-on-dark)',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: 'var(--button-lime)',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Track
        </button>
      </form>

      {!searchNumber && (
        <p style={{ color: 'var(--text-muted-dark)' }}>Enter a shipment number and click Track.</p>
      )}

      {searchNumber && loading && !shipment && <p>Loading…</p>}
      {searchNumber && error && (
        <p style={{ color: '#f87171' }}>{error}</p>
      )}

      {searchNumber && shipment && (
        <>
          <ShipmentCard shipment={shipment} />

          <h2 style={{ marginTop: 32, marginBottom: 16, color: 'var(--text-on-dark)' }}>Location</h2>
          <ShipmentMap
            shipments={[shipment]}
            height="min(320px, 50vw)"
            showOnlyWithCoords={false}
          />

          <h2 style={{ marginTop: 32, marginBottom: 16, color: 'var(--text-on-dark)' }}>Status History</h2>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted-dark)', padding: '12px 16px', background: 'var(--theme-dark-card)', border: '1px solid var(--theme-dark-border)', borderRadius: 8 }}>
              No status updates yet.
            </p>
          ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {history.map((h, i) => (
              <li
                key={i}
                style={{
                  padding: '12px 16px',
                  background: 'var(--theme-dark-card)',
                  border: '1px solid var(--theme-dark-border)',
                  borderTop: i === 0 ? '1px solid var(--theme-dark-border)' : 'none',
                  borderRadius: i === 0 ? '8px 8px 0 0' : i === history.length - 1 ? '0 0 8px 8px' : 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <StatusBadge status={h.status} />
                  <span style={{ marginLeft: 12, color: 'var(--text-muted-dark)' }}>{h.locationName || '—'}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted-dark)' }}>
                  {h.recordedAt ? new Date(h.recordedAt).toLocaleString() : '—'}
                </span>
              </li>
            ))}
          </ul>
          )}
        </>
      )}
    </div>
  );
}
