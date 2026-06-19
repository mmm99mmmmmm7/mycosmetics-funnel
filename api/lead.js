export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};
    const vorname = data.vorname || '-';
    const wa = data.whatsapp_nummer || '-';
    const sit = data.situation || '-';
    const start = data.start_zeitraum || '-';
    const budget = data.budget || '-';
    const ts = data.timestamp || '-';

    const ntfyBody = [
      'Name: ' + vorname,
      'WhatsApp: ' + wa,
      'Situation: ' + sit,
      'Start: ' + start,
      'Budget: ' + budget,
      'Zeit: ' + ts,
    ].join('\n');

    // ntfy.sh push notification (ASCII-safe headers)
    const ntfyResult = await fetch('https://ntfy.sh/mycosmetics-leads-br7x9k2m', {
      method: 'POST',
      headers: {
        'Title': 'Neuer Lead: ' + vorname.replace(/[^\x20-\x7E]/g, ''),
        'Priority': '4',
      },
      body: ntfyBody,
    }).then(r => ({ ok: r.ok, status: r.status }))
      .catch(e => ({ ok: false, error: String(e) }));

    console.log('ntfy result:', JSON.stringify(ntfyResult));

    // Zapier webhook -> E-Mail-Benachrichtigung
    const zapierResult = await fetch('https://hooks.zapier.com/hooks/catch/19006437/4o5zeol/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vorname: vorname,
        whatsapp_nummer: wa,
        situation: sit,
        start_zeitraum: start,
        budget: budget,
        timestamp: ts,
      }),
    }).then(r => ({ ok: r.ok, status: r.status }))
      .catch(e => ({ ok: false, error: String(e) }));

    console.log('zapier result:', JSON.stringify(zapierResult));

    // formsubmit.co backup (fire and forget)
    fetch('https://formsubmit.co/ajax/kontakt@benjaminrumold.de', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ _subject: 'Neuer Lead - MyCosmetics Funnel', _template: 'table', ...data }),
    }).catch(() => {});

    console.log('NEW LEAD:', JSON.stringify({ vorname, wa, sit, start, budget, ts }));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lead handler error:', String(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
