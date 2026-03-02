/**
 * Zoho OAuth – auth URL and callback to get Refresh Token.
 * One-time setup: open auth URL → login → callback exchanges code for refresh_token.
 */
import { Router } from 'express';
import { getRefreshTokenFromCode, getLeads, getDeals, isZohoEnabled } from '../services/zoho.js';

const router = Router();
const REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || 'http://localhost:5001/api/zoho/callback';
const ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || 'zoho.in';
const SCOPE = 'ZohoCRM.modules.ALL';

/**
 * GET /api/zoho/setup
 * One-click: redirects to Zoho auth. After you login, you land on callback and get refresh token.
 */
router.get('/setup', (req, res) => {
  const clientId = process.env.ZOHO_CLIENT_ID;
  if (!clientId) {
    return res.status(400).send(`
      <h2>Zoho setup</h2>
      <p>Set <code>ZOHO_CLIENT_ID</code> and <code>ZOHO_CLIENT_SECRET</code> in backend <code>.env</code>, then restart and open this page again.</p>
    `);
  }
  res.send(`
    <h2>Zoho – Ek baar sahi setup (phir refresh token dubara generate nahi karna padega)</h2>
    <div style="background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;margin-bottom:20px;">
      <p style="margin:0 0 12px;"><strong>Zoho API Console mein ye check karo:</strong></p>
      <ul style="margin:0;padding-left:20px;">
        <li>Client type <strong>Server-based Application</strong> ho (Client-based / Self client mat banao).</li>
        <li>Redirect URI neeche diye gaye URI se <em>bilkul match</em> kare (no trailing slash).</li>
        <li>Refresh token milne ke baad <strong>Client Secret dubara regenerate mat karo</strong> – purana token invalid ho jayega.</li>
      </ul>
    </div>
    <p><strong>Step 1:</strong> Zoho API Console (India): <a href="https://api-console.zoho.in" target="_blank" rel="noopener">api-console.zoho.in</a> → apna Client → <strong>Redirect URI</strong> add karo:</p>
    <pre id="redirect-uri" style="background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;overflow:auto;font-size:14px;">${REDIRECT_URI}</pre>
    <p><button onclick="navigator.clipboard.writeText(document.getElementById('redirect-uri').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy Redirect URI',1500)" style="padding:10px 20px;background:#1e293b;color:#e2e8f0;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Copy Redirect URI</button></p>
    <p><strong>Step 2:</strong> Zoho mein <strong>Save</strong> karo. Phir neeche <strong>Authorize with Zoho</strong> par click karo → login → jo refresh token mile use <code>.env</code> mein <code>ZOHO_REFRESH_TOKEN</code> daal do. Bas ek baar – uske baad ye token expire nahi hota (server-based app).</p>
    <p><a href="${`https://accounts.${ACCOUNTS_DOMAIN}/oauth/v2/auth?scope=${encodeURIComponent(SCOPE)}&client_id=${encodeURIComponent(clientId)}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&prompt=consent`}" style="display:inline-block;padding:12px 24px;background:#c23616;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Authorize with Zoho</a></p>
  `);
});

/**
 * GET /api/zoho/auth-url
 * Returns the URL to open in browser to authorize and get a one-time code.
 */
router.get('/auth-url', (req, res) => {
  const clientId = process.env.ZOHO_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({ error: 'Set ZOHO_CLIENT_ID in .env' });
  }
  const url = `https://accounts.${ACCOUNTS_DOMAIN}/oauth/v2/auth?scope=${encodeURIComponent(SCOPE)}&client_id=${encodeURIComponent(clientId)}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&prompt=consent`;
  res.json({ authUrl: url });
});

/**
 * GET /api/zoho/callback?code=...
 * After user logs in, Zoho redirects here with ?code=xxx. We exchange code for refresh_token.
 * (Used when redirect_uri is backend URL, e.g. http://localhost:5001/api/zoho/callback)
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send(`
      <h2>Zoho callback</h2>
      <p>Missing <code>code</code> in URL. Make sure you opened the auth URL and logged in first.</p>
      <p>Get auth URL: <a href="/api/zoho/auth-url">/api/zoho/auth-url</a></p>
    `);
  }
  try {
    const { refresh_token } = await getRefreshTokenFromCode(code, REDIRECT_URI);
    res.send(`
      <h2>Zoho Refresh Token</h2>
      <p>Add this to your backend <code>.env</code>:</p>
      <pre style="background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;overflow:auto;">ZOHO_REFRESH_TOKEN=${refresh_token}</pre>
      <p>Then set <code>ZOHO_INTEGRATION_ENABLED=true</code> and restart the backend.</p>
    `);
  } catch (err) {
    res.status(400).send(`
      <h2>Error</h2>
      <p>${err.message}</p>
      <p>Check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and ZOHO_ACCOUNTS_DOMAIN in .env. Redirect URI in Zoho console must be: ${REDIRECT_URI}</p>
    `);
  }
});

/**
 * POST /api/zoho/exchange-code
 * Body: { code }. Used when Zoho redirects to frontend (e.g. http://localhost:5173/oauth/callback).
 * Exchanges code for refresh_token using REDIRECT_URI (must match Zoho Console).
 */
router.post('/exchange-code', async (req, res) => {
  const code = req.body?.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }
  try {
    const { refresh_token } = await getRefreshTokenFromCode(code, REDIRECT_URI);
    return res.json({ refresh_token });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Exchange failed' });
  }
});

/**
 * GET /api/zoho/leads
 * Query: next_step=1 – only non-converted (next step) leads.
 */
router.get('/leads', async (req, res) => {
  if (!isZohoEnabled()) return res.status(400).json({ error: 'Zoho integration not enabled' });
  try {
    const nextStepOnly = req.query.next_step === '1' || req.query.next_step === 'true';
    const data = await getLeads(nextStepOnly);
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/zoho/deals
 * Query: next_step=1 – only deals not in closed stages.
 */
router.get('/deals', async (req, res) => {
  if (!isZohoEnabled()) return res.status(400).json({ error: 'Zoho integration not enabled' });
  try {
    const nextStepOnly = req.query.next_step === '1' || req.query.next_step === 'true';
    const data = await getDeals(nextStepOnly);
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export { router as zohoRoutes };
