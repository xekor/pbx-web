'use server';

// Simple, pluggable API to extract a decedent name from free text.
// Provider selection via env:
// - AI_PROVIDER=openai uses OpenAI (requires OPENAI_API_KEY)
// - AI_PROVIDER=wizardd posts to a local service at WIZARDD_BASE_URL
// - default is 'mock' which uses heuristics (no network)

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Invalid text' }, { status: 400 });
    }

    const provider = process.env.AI_PROVIDER || 'mock';

    let name = '';
    if (provider === 'openai') {
      name = await extractWithOpenAI(text);
    } else if (provider === 'wizardd') {
      name = await extractWithWizardd(text);
    } else {
      name = extractWithHeuristics(text);
    }

    // Normalize/capitalize name conservatively
    name = normalizeName(name);

    return Response.json({ name });
  } catch (err) {
    return Response.json({ error: 'Failed to extract name' }, { status: 500 });
  }
}

function normalizeName(input) {
  if (!input || typeof input !== 'string') return '';
  // Trim and collapse spaces
  const cleaned = input.trim().replace(/\s+/g, ' ').slice(0, 80);
  // Capitalize first letter of each token, keep hyphens/apostrophes
  return cleaned
    .split(' ')
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function extractWithHeuristics(text) {
  // Look for quoted names first: "John M. Doe"
  const quoted = text.match(/"([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-\.]+){1,3})"/);
  if (quoted && quoted[1]) return quoted[1];

  // Otherwise, find sequences of 2-4 capitalized words (allowing middle initials)
  const re = /\b([A-Z][a-zA-Z'\-]+(?:\s+[A-Z](?:\.|[a-zA-Z'\-]+)){1,3})\b/g;
  let best = '';
  let match;
  while ((match = re.exec(text)) !== null) {
    const candidate = match[1];
    // Prefer longer names (2-3 tokens) but cap at 4
    const tokens = candidate.split(/\s+/);
    if (tokens.length >= 2 && tokens.length <= 4) {
      best = candidate;
      break;
    }
  }
  return best;
}

async function extractWithOpenAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  // Use Responses API style request for structured JSON
  const prompt = `You are extracting fields from user text for a Small Estate Affidavit form.\nReturn strict JSON with a single key \'name\' (string), containing the decedent's full legal name if stated, else an empty string.\nUser text:\n---\n${text}\n---`;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: prompt,
      // Nudge to JSON
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`OpenAI error: ${msg}`);
  }
  const data = await res.json();
  const content = data?.output?.[0]?.content?.[0]?.text || data?.choices?.[0]?.message?.content || '';
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { name: '' };
  }
  return typeof parsed.name === 'string' ? parsed.name : '';
}

async function extractWithWizardd(text) {
  const base = process.env.WIZARDD_BASE_URL || 'http://localhost:8000';
  // Expect a simple JSON API: POST /v1/extract { task: 'extract-name', text }
  const res = await fetch(`${base}/v1/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: 'extract-name', text }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Wizardd error: ${msg}`);
  }
  const data = await res.json();
  return typeof data.name === 'string' ? data.name : '';
}

