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

    // ntfy.sh Push-Notification
    await fetch('https://ntfy.sh/mycosmetics-leads-br7x9k2m', {
      method: 'POST',
      headers: {
        'Title': 'Neuer Lead: ' + vorname.replace(/[^\x20-\x7E]/g, ''),
        'Priority': '4',
      },
      body: ntfyBody,
    }).catch(() => {});

    // E-Mail via formsubmit.co
    await fetch('https://formsubmit.co/ajax/my.cosmetics@gmx.de', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: '🎯 Neuer Lead – ' + vorname,
        _template: 'table',
        Name: vorname,
        WhatsApp: wa,
        Situation: sit,
        'Start-Zeitraum': start,
        Budget: budget,
        Zeitpunkt: ts,
      }),
    }).catch(() => {});

    console.log('NEW LEAD:', JSON.stringify({ vorname, wa, sit, start, budget, ts }));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lead handler error:', String(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
