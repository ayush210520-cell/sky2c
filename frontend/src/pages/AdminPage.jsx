/**
 * Admin dashboard: create shipment, assign, update status, update location.
 * Map shows all active shipments; data polls every 2 minutes.
 */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { shipments as api } from '../api/client.js';
import { usePoll } from '../hooks/usePoll.js';
import { ShipmentMap } from '../components/ShipmentMap.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { LocationAutocomplete } from '../components/LocationAutocomplete.jsx';

const POLL_MS = 2 * 60 * 1000;
const STATUS_OPTIONS = [
  'Created',
  'Picked Up',
  'Dispatched',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

function ensureArray(val) {
  return Array.isArray(val) ? val : [];
}

export function AdminPage() {
  const [form, setForm] = useState({
    customerEmail: '',
    assignedTo: '',
    transportMode: 'Truck',
    currentLocationName: '',
    pickupLocationName: '',
    destinationName: '',
  });
  const [assignNum, setAssignNum] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [statusNum, setStatusNum] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [locNum, setLocNum] = useState('');
  const [locName, setLocName] = useState('');
  const [selectedShipmentForMap, setSelectedShipmentForMap] = useState('');
  const [activeForm, setActiveForm] = useState('create');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(() => api.getAll(false), []);
  const { data: rawShipments, loading: loadingList, error: listError, refresh } = usePoll(fetchAll, POLL_MS);
  const allShipments = ensureArray(rawShipments);
  const activeShipments = allShipments.filter((s) => s && s.currentStatus !== 'Delivered');

  const showMsg = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
    if (!isError) refresh();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.create({
        customerEmail: form.customerEmail,
        assignedTo: form.assignedTo,
        transportMode: form.transportMode,
        currentLocationName: form.currentLocationName,
        pickupLocationName: form.pickupLocationName,
        destinationName: form.destinationName,
      });
      showMsg('Shipment created. Location coordinates are set automatically from names.');
      setForm({
        customerEmail: '',
        assignedTo: '',
        transportMode: 'Truck',
        currentLocationName: '',
        pickupLocationName: '',
        destinationName: '',
      });
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignNum.trim() || !assignTo.trim()) {
      showMsg('Shipment number and Assigned To are required.', true);
      return;
    }
    setLoading(true);
    try {
      await api.assign(assignNum.trim(), assignTo.trim());
      showMsg('Shipment assigned.');
      setAssignNum('');
      setAssignTo('');
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (e) => {
    e.preventDefault();
    if (!statusNum.trim() || !statusValue) {
      showMsg('Shipment number and status are required.', true);
      return;
    }
    setLoading(true);
    try {
      await api.updateStatus(statusNum.trim(), statusValue);
      showMsg('Status updated. Customer will receive an email if applicable.');
      setStatusNum('');
      setStatusValue('');
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleLocation = async (e) => {
    e.preventDefault();
    if (!locNum.trim()) {
      showMsg('Shipment number is required.', true);
      return;
    }
    setLoading(true);
    try {
      await api.updateLocation(locNum.trim(), {
        locationName: locName.trim() || undefined,
      });
      showMsg('Location updated. Coordinates are set automatically from the location name.');
      setLocNum('');
      setLocName('');
    } catch (err) {
      showMsg(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid var(--theme-dark-border)',
    borderRadius: 6,
    fontSize: 14,
    width: '100%',
  };
  const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 };
  const sectionStyle = {
    border: '1px solid var(--theme-dark-border)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    background: 'var(--theme-dark-card)',
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--theme-dark)' }}>
      {/* Always visible header */}
      <div style={{ padding: '12px 16px', marginBottom: 24, background: 'var(--theme-dark-lighter)', color: 'var(--text-on-dark)', borderRadius: 8, border: '1px solid var(--theme-dark-border)' }}>
        <strong>Admin Dashboard</strong> — Shipment management
      </div>

      <nav style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Link to="/" style={{ color: 'var(--tagline-yellow)' }}>← Home</Link>
        <Link to="/track" style={{ color: 'var(--tagline-yellow)' }}>Track Shipment</Link>
      </nav>

      <h1 style={{ marginBottom: 8, color: 'var(--text-on-dark)' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--text-muted-dark)', marginBottom: 24 }}>
        Create shipments, assign carriers, and update status and location.
      </p>

      {/* API status – always visible at top */}
      <div
        style={{
          padding: 16,
          marginBottom: 24,
          borderRadius: 8,
          background: listError ? 'rgba(220,38,38,0.15)' : loadingList ? 'var(--theme-dark-card)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${listError ? '#fecaca' : loadingList ? 'var(--theme-dark-border)' : 'rgba(34,197,94,0.3)'}`,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted-dark)', marginBottom: 8 }}>
          API: {import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}
        </div>
        {loadingList && <strong>Connecting to backend…</strong>}
        {listError && (
          <div>
            <strong style={{ color: '#b91c1c' }}>Backend not connected</strong>
            <p style={{ margin: '8px 0 0', color: '#991b1b' }}>{listError}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14 }}>
              Start backend: <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>cd backend && npm run dev</code>
              <br />
              Backend runs on port 5001. In <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>frontend/.env</code> set <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>VITE_API_URL=http://localhost:5001/api</code> then restart frontend.
            </p>
            <button
              type="button"
              onClick={() => window.open((import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '') + '/api/shipments', '_blank')}
              style={{ marginTop: 12, padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              Open API in new tab (test)
            </button>
          </div>
        )}
        {!loadingList && !listError && (
          <strong style={{ color: 'var(--button-lime)' }}>
            Backend connected. Shipments: {allShipments.length} ({activeShipments.length} active)
          </strong>
        )}
      </div>

      {message && (
        <p
          style={{
            padding: 12,
            borderRadius: 8,
            background: message.includes('required') || message.includes('Invalid') ? 'rgba(220,38,38,0.15)' : 'rgba(34,197,94,0.1)',
            color: message.includes('required') || message.includes('Invalid') ? '#fca5a5' : '#86efac',
            marginBottom: 24,
          }}
        >
          {message}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* All Shipments – compact list */}
        <section style={sectionStyle} className="section-card">
          <h2 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-on-dark)' }}>All Shipments</h2>
          {loadingList ? (
            <p style={{ color: 'var(--text-muted-dark)' }}>Loading shipments…</p>
          ) : listError ? (
            <p style={{ color: '#f87171' }}>Cannot load list. See message above.</p>
          ) : allShipments.length === 0 ? (
            <p style={{ color: 'var(--text-muted-dark)' }}>No shipments yet. Create one below. (Demo shipment SHP-DEMO-001 appears when backend is running.)</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--theme-dark-border)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted-dark)', fontWeight: 600 }}>Shipment #</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted-dark)', fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted-dark)', fontWeight: 600 }}>Route</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted-dark)', fontWeight: 600 }}>Assigned To</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted-dark)', fontWeight: 600 }}>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {allShipments.map((s) => (
                    <tr key={s.shipmentNumber} style={{ borderBottom: '1px solid var(--theme-dark-border)' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-on-dark)', fontWeight: 500 }}>{s.shipmentNumber}</td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge status={s.currentStatus} /></td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-on-dark)' }}>{s.pickupLocationName || '—'} → {s.destinationName || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted-dark)' }}>{s.assignedTo || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted-dark)', fontSize: 12 }}>{s.lastUpdatedTime ? new Date(s.lastUpdatedTime).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Map */}
        <section style={sectionStyle} className="section-card">
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Map – Active Shipments</h2>
          {activeShipments.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Show on map</label>
              <select
                value={selectedShipmentForMap}
                onChange={(e) => setSelectedShipmentForMap(e.target.value)}
                style={{ ...inputStyle, maxWidth: 320 }}
              >
                <option value="">All active shipments</option>
                {activeShipments.map((s) => (
                  <option key={s.shipmentNumber} value={s.shipmentNumber}>
                    {s.shipmentNumber} – {s.pickupLocationName || '?'} → {s.destinationName || '?'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="map-wrap">
            {activeShipments.length > 0 ? (
              <ShipmentMap
                shipments={
                  selectedShipmentForMap
                    ? activeShipments.filter((s) => s.shipmentNumber === selectedShipmentForMap)
                    : activeShipments
                }
                height="min(400px, 55vw)"
              />
            ) : (
            <div style={{ height: 200, background: 'var(--theme-dark-card)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted-dark)' }}>
              No active shipments to show on map
            </div>
          )}
          </div>
        </section>

        {/* Forms – tab bar + one form at a time */}
        <section style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid var(--theme-dark-border)',
            }}
          >
            {[
              { id: 'create', label: 'Create Shipment' },
              { id: 'assign', label: 'Assign Shipment' },
              { id: 'status', label: 'Update Status' },
              { id: 'location', label: 'Update Location' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveForm(tab.id)}
                style={{
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  border: '2px solid var(--theme-dark-border)',
                  borderRadius: 8,
                  background: activeForm === tab.id ? 'rgba(223, 255, 0, 0.2)' : 'transparent',
                  color: activeForm === tab.id ? 'var(--button-lime)' : 'var(--text-on-dark)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeForm === 'create' && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-on-dark)' }}>Create Shipment</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Customer Email</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Assigned To (Transporter / Line / Airline)</label>
                <input
                  type="text"
                  value={form.assignedTo}
                  onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  style={inputStyle}
                  placeholder="e.g. DHL, Maersk"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Transport Mode</label>
                <select
                  value={form.transportMode}
                  onChange={(e) => setForm((f) => ({ ...f, transportMode: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Truck">Truck</option>
                  <option value="Ocean">Ocean</option>
                  <option value="Air">Air</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Current Location Name</label>
                <LocationAutocomplete
                  value={form.currentLocationName}
                  onChange={(v) => setForm((f) => ({ ...f, currentLocationName: v }))}
                  placeholder="e.g. Mumbai Warehouse"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Pickup (from where)</label>
                <LocationAutocomplete
                  value={form.pickupLocationName}
                  onChange={(v) => setForm((f) => ({ ...f, pickupLocationName: v }))}
                  placeholder="e.g. Mumbai, India"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Destination (where to deliver)</label>
                <LocationAutocomplete
                  value={form.destinationName}
                  onChange={(v) => setForm((f) => ({ ...f, destinationName: v }))}
                  placeholder="e.g. Delhi, India"
                  style={inputStyle}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-dark)', marginBottom: 16 }}>Lat/long are set automatically from location names.</p>
              <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: 'var(--button-lime)', color: '#1a1a1a', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Create
              </button>
            </form>
          </>
          )}

          {activeForm === 'assign' && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-on-dark)' }}>Assign Shipment</h2>
              <form onSubmit={handleAssign}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Shipment Number</label>
                <input type="text" value={assignNum} onChange={(e) => setAssignNum(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Assigned To</label>
                <input type="text" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} style={inputStyle} required />
              </div>
              <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: 'var(--button-lime)', color: '#1a1a1a', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Assign
              </button>
            </form>
          </>
          )}

          {activeForm === 'status' && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-on-dark)' }}>Update Status</h2>
              <form onSubmit={handleStatus}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Shipment Number</label>
                <input type="text" value={statusNum} onChange={(e) => setStatusNum(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>New Status</label>
                <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)} style={inputStyle} required>
                  <option value="">Select…</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: 'var(--button-lime)', color: '#1a1a1a', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Update Status
              </button>
            </form>
          </>
          )}

          {activeForm === 'location' && (
            <>
              <h2 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-on-dark)' }}>Update Location</h2>
              <form onSubmit={handleLocation}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Shipment Number</label>
                <input type="text" value={locNum} onChange={(e) => setLocNum(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Location Name</label>
                <LocationAutocomplete
                  value={locName}
                  onChange={setLocName}
                  placeholder="e.g. Indore Hub, India"
                  style={inputStyle}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-dark)', marginBottom: 16 }}>Coordinates are set automatically from the location name.</p>
              <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: 'var(--button-lime)', color: '#1a1a1a', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Update Location
              </button>
            </form>
          </>
          )}
        </section>
      </div>
    </div>
  );
}
