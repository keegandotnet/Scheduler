/**
 * Resets swap data and inserts a fresh demo dataset (future shifts, sample offers, one pending claim).
 * Usage: node scripts/seed-demo.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function req(method, table, { search = '', body } = {}) {
  const url = `${BASE}/${table}${search}`;
  const opts = { method, headers: { ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  if (text && res.status !== 204) {
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
  }
  if (!res.ok) {
    throw new Error(`${method} ${table}${search} → ${res.status} ${text.slice(0, 500)}`);
  }
  return json;
}

// ── IDs (stable mock data) ─────────────────────────────────────────
const MANAGER = '35f6175a-7f16-4691-b2e8-f627c1019d64';
const ALICE = '9bcc0881-b502-41ed-b416-605ea6316655';
const BOB = '5b908e54-1de5-45c8-aac1-c9f8f1c07a59';
const CHARLIE = '9bf77209-3135-4405-a2c8-40eb9855c4ec';
const POS = {
  cashier: '11111111-0000-0000-0000-000000000001',
  supervisor: '11111111-0000-0000-0000-000000000002',
  stock: '11111111-0000-0000-0000-000000000003',
};

function iso(d) {
  return d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function atHour(d, h, m = 0) {
  const x = new Date(d);
  x.setUTCHours(h, m, 0, 0);
  return x;
}

async function main() {
  console.log('Fetching manager id…');
  const profiles = await req('GET', 'profiles', { search: '?select=id,full_name,role&role=eq.manager' });
  const managerId = profiles?.[0]?.id ?? MANAGER;
  console.log('Manager:', managerId);

  console.log('Deleting shift_claims…');
  await req('DELETE', 'shift_claims', { search: '?id=neq.00000000-0000-0000-0000-000000000000' });

  console.log('Deleting shift_offers…');
  await req('DELETE', 'shift_offers', { search: '?id=neq.00000000-0000-0000-0000-000000000000' });

  console.log('Deleting shifts…');
  await req('DELETE', 'shifts', { search: '?id=neq.00000000-0000-0000-0000-000000000000' });

  const today = new Date();
  // Start scheduling from tomorrow UTC to avoid “past” edge cases with constraints
  const base = addDays(today, 1);
  base.setUTCHours(0, 0, 0, 0);

  const shifts = [
    { owner_id: ALICE, position_id: POS.cashier, start: atHour(addDays(base, 0), 14, 0), end: atHour(addDays(base, 0), 18, 0), status: 'scheduled' },
    { owner_id: BOB, position_id: POS.supervisor, start: atHour(addDays(base, 1), 15, 0), end: atHour(addDays(base, 1), 19, 0), status: 'scheduled' },
    { owner_id: CHARLIE, position_id: POS.stock, start: atHour(addDays(base, 2), 10, 0), end: atHour(addDays(base, 2), 14, 0), status: 'scheduled' },
    { owner_id: ALICE, position_id: POS.supervisor, start: atHour(addDays(base, 3), 16, 0), end: atHour(addDays(base, 3), 22, 0), status: 'scheduled' },
    { owner_id: BOB, position_id: POS.cashier, start: atHour(addDays(base, 4), 9, 0), end: atHour(addDays(base, 4), 13, 0), status: 'scheduled' },
    { owner_id: CHARLIE, position_id: POS.cashier, start: atHour(addDays(base, 5), 17, 0), end: atHour(addDays(base, 5), 21, 0), status: 'scheduled' },
    { owner_id: ALICE, position_id: POS.stock, start: atHour(addDays(base, 6), 12, 0), end: atHour(addDays(base, 6), 16, 0), status: 'scheduled' },
    { owner_id: BOB, position_id: POS.stock, start: atHour(addDays(base, 7), 13, 0), end: atHour(addDays(base, 7), 17, 0), status: 'scheduled' },
    // Extra density for calendar week 2
    { owner_id: CHARLIE, position_id: POS.supervisor, start: atHour(addDays(base, 8), 14, 30), end: atHour(addDays(base, 8), 18, 30), status: 'scheduled' },
    { owner_id: ALICE, position_id: POS.cashier, start: atHour(addDays(base, 9), 11, 0), end: atHour(addDays(base, 9), 15, 0), status: 'scheduled' },
  ];

  const rows = shifts.map((s) => ({
    owner_id: s.owner_id,
    created_by: managerId,
    position_id: s.position_id,
    start_time: iso(s.start),
    end_time: iso(s.end),
    status: s.status,
  }));

  console.log(`Inserting ${rows.length} shifts…`);
  const inserted = await req('POST', 'shifts', { body: rows });
  if (!Array.isArray(inserted)) throw new Error('Expected array from shifts insert');

  // Alice offers her first shift (index 0); Bob offers his shift (index 1)
  const aliceShift = inserted.find((r) => r.owner_id === ALICE);
  const bobShift = inserted.find((r) => r.owner_id === BOB && r.position_id === POS.supervisor);
  if (!aliceShift || !bobShift) throw new Error('Could not locate demo shifts for offers');

  console.log('Inserting open offers…');
  const offers = await req('POST', 'shift_offers', {
    body: [
      {
        shift_id: aliceShift.id,
        offered_by: ALICE,
        message: 'Family event — happy to swap with anyone qualified.',
        status: 'open',
      },
      {
        shift_id: bobShift.id,
        offered_by: BOB,
        message: 'Need morning coverage if anyone can take supervisor slot.',
        status: 'open',
      },
    ],
  });

  const offerAlice = offers.find((o) => o.offered_by === ALICE);
  if (!offerAlice) throw new Error('Missing Alice offer');

  console.log('Inserting pending claim (Charlie claims Alice’s offer)…');
  await req('POST', 'shift_claims', {
    body: [
      {
        offer_id: offerAlice.id,
        claimant_id: CHARLIE,
        message: 'I can cover — let me know.',
        status: 'pending',
      },
    ],
  });

  console.log('Done. Summary:');
  console.log(`  • ${inserted.length} shifts (next ~10 days)`);
  console.log(`  • 2 open offers (Alice + Bob)`);
  console.log(`  • 1 pending claim (Charlie on Alice’s shift) — visible on Claims for manager`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
