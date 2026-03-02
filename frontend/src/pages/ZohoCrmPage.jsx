/**
 * Zoho CRM: view Leads and Deals. Toggle "Next step only" to see open/non-closed records.
 */
import { useState, useEffect, useCallback } from 'react';
import { zoho as api } from '../api/client.js';

function pickDisplay(obj, ...keys) {
  if (obj == null) return '';
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === 'object' && v.name != null) return v.name;
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function LeadRow({ record }) {
  const name = pickDisplay(record, 'Full_Name', 'First_Name', 'Last_Name') || `Lead #${record.id}`;
  const company = pickDisplay(record, 'Company');
  const email = pickDisplay(record, 'Email');
  const status = pickDisplay(record, 'Lead_Status');
  const owner = pickDisplay(record.Owner, 'name');
  return (
    <tr>
      <td>{name}</td>
      <td>{company}</td>
      <td>{email}</td>
      <td><span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: 'var(--theme-dark-border)', fontSize: 12 }}>{status || '—'}</span></td>
      <td>{owner}</td>
    </tr>
  );
}

function DealRow({ record }) {
  const name = pickDisplay(record, 'Deal_Name', 'Deal_Name') || `Deal #${record.id}`;
  const stage = pickDisplay(record, 'Stage');
  const amount = record.Amount != null ? record.Amount : pickDisplay(record, 'Amount');
  const contact = pickDisplay(record, 'Contact_Name');
  const owner = pickDisplay(record.Owner, 'name');
  return (
    <tr>
      <td>{name}</td>
      <td><span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: 'var(--theme-dark-border)', fontSize: 12 }}>{stage || '—'}</span></td>
      <td>{amount || '—'}</td>
      <td>{contact}</td>
      <td>{owner}</td>
    </tr>
  );
}

export function ZohoCrmPage() {
  const [tab, setTab] = useState('leads'); // 'leads' | 'deals'
  const [nextStepOnly, setNextStepOnly] = useState(true);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getLeads(nextStepOnly);
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [nextStepOnly]);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getDeals(nextStepOnly);
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [nextStepOnly]);

  useEffect(() => {
    if (tab === 'leads') loadLeads();
    else loadDeals();
  }, [tab, nextStepOnly, loadLeads, loadDeals]);

  const list = tab === 'leads' ? leads : deals;

  return (
    <div className="zoho-crm-page" style={{ padding: '24px 16px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>Zoho CRM</h1>
      <p style={{ color: 'var(--text-muted-dark)', marginBottom: 24 }}>
        Deals aur Leads yahan dikhte hain. <strong>Sirf next step</strong> se open / non-closed records filter karo.
      </p>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setTab('leads')}
            style={{
              padding: '10px 20px',
              border: `2px solid ${tab === 'leads' ? 'var(--button-lime)' : 'var(--theme-dark-border)'}`,
              background: tab === 'leads' ? 'var(--button-lime)' : 'transparent',
              color: tab === 'leads' ? '#0f172a' : 'var(--text-muted-dark)',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Leads
          </button>
          <button
            type="button"
            onClick={() => setTab('deals')}
            style={{
              padding: '10px 20px',
              border: `2px solid ${tab === 'deals' ? 'var(--button-lime)' : 'var(--theme-dark-border)'}`,
              background: tab === 'deals' ? 'var(--button-lime)' : 'transparent',
              color: tab === 'deals' ? '#0f172a' : 'var(--text-muted-dark)',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Deals
          </button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={nextStepOnly}
            onChange={(e) => setNextStepOnly(e.target.checked)}
          />
          <span>Sirf next step (open / non-closed)</span>
        </label>
        <button
          type="button"
          onClick={() => (tab === 'leads' ? loadLeads() : loadDeals())}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: 'var(--theme-dark-card)',
            border: '1px solid var(--theme-dark-border)',
            borderRadius: 8,
            color: 'var(--text-primary-dark)',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(220,38,38,0.15)', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#fca5a5' }}>
          <p style={{ margin: 0 }}>{error}</p>
          {(/refresh token|invalid|expired/i).test(error) && (
            <p style={{ margin: '12px 0 0', fontSize: 14 }}>
              <strong>Naya refresh token kaise banaye:</strong> Backend par jao → browser mein <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>http://localhost:5001/api/zoho/setup</code> open karo, wahan se Zoho se dubara Authorize karo. Jo refresh token mile use <code>.env</code> mein <code>ZOHO_REFRESH_TOKEN</code> mein paste karo aur backend restart karo.
            </p>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'var(--theme-dark-card)', border: '1px solid var(--theme-dark-border)', borderRadius: 12 }}>
        {tab === 'leads' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-dark-border)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Name</th>
                <th style={{ padding: 12 }}>Company</th>
                <th style={{ padding: 12 }}>Email</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && !loading && <tr><td colSpan={5} style={{ padding: 24, color: 'var(--text-muted-dark)' }}>Koi lead nahi mila.</td></tr>}
              {list.map((r) => <LeadRow key={r.id} record={r} />)}
            </tbody>
          </table>
        )}
        {tab === 'deals' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--theme-dark-border)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Deal</th>
                <th style={{ padding: 12 }}>Stage</th>
                <th style={{ padding: 12 }}>Amount</th>
                <th style={{ padding: 12 }}>Contact</th>
                <th style={{ padding: 12 }}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && !loading && <tr><td colSpan={5} style={{ padding: 24, color: 'var(--text-muted-dark)' }}>Koi deal nahi mili.</td></tr>}
              {list.map((r) => <DealRow key={r.id} record={r} />)}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted-dark)' }}>
        {tab === 'leads' && nextStepOnly && 'Non-converted leads dikhaye ja rahe hain.'}
        {tab === 'leads' && !nextStepOnly && 'Saari leads dikhai ja rahi hain.'}
        {tab === 'deals' && nextStepOnly && 'Sirf open deals (Closed Won/Lost exclude).'}
        {tab === 'deals' && !nextStepOnly && 'Saari deals dikhai ja rahi hain.'}
      </p>
    </div>
  );
}
