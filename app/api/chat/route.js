import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Ensure Node runtime (OpenAI SDK needs Node, not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Basic validation helpers
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  return trimmed.replace(/\s+/g, ' ');
}

function parseIsoDate(input) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const current = new Date().getFullYear();
  if (year < 1900 || year > current) return null;
  return d.toISOString().split('T')[0];
}

export async function POST(req) {
  try {
    const { userInput, state, conversationId, fieldUpdate } = await req.json();
    console.log('[chat] request', { userInput, state, conversationId, fieldUpdate });

    // Keep state minimal for this intake
    const session = {
      decedentFullName: state?.decedentFullName || '',
      decedentDodIso: state?.decedentDodIso || ''
    };

    // No compact state summary included in model input; rely on conversation context.

    const tools = [
      {
        type: 'function',
        name: 'set_decedent_name',
        description: 'Record the decedent\'s full legal name exactly as provided by the user.',
        parameters: {
          type: 'object',
          properties: {
            fullName: { type: 'string', description: 'Full legal name of the decedent' }
          },
          required: ['fullName']
        }
      },
      {
        type: 'function',
        name: 'set_death_date',
        description: 'Record the decedent\'s date of death. Accept common date formats; server validates and stores ISO YYYY-MM-DD.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date of death provided by the user' }
          },
          required: ['date']
        }
      }
    ];

    const instructions = `You are a Utah probate intake assistant.
- Collect exactly two items in order: (1) decedent full legal name, (2) date of death.
- Ask for only the next missing item. If name is saved, do not ask for it again.
- IMPORTANT: When the user provides information that satisfies the next item, you MUST call the corresponding tool (set_decedent_name or set_death_date). Do not only respond with text.
- After saving the name successfully, immediately ask for the date of death.
- After saving the date successfully, confirm both values concisely.
- If the user asks for anything unrelated (e.g., shopping, product recommendations), respond briefly that you can only collect intake info and immediately ask the next required item.
- PRIVACY: The user-provided values are never included in tool outputs or assistant messages. Tool outputs only include success flags. Do not echo or paraphrase values in any way.
- Be concise, professional, and empathetic. Avoid repeating previous questions.`;

    // Build input with authoritative state (Responses API content format)
    const input = [];
    input.push({ role: 'system', content: [{ type: 'input_text', text: instructions }] });
    // Privacy: if fieldUpdate is provided, do not include user text in model input
    if (!fieldUpdate && userInput && userInput.trim()) {
      input.push({ role: 'user', content: [{ type: 'input_text', text: userInput.trim() }] });
    } else if (fieldUpdate) {
      input.push({ role: 'user', content: [{ type: 'input_text', text: 'User provided the requested field.' }] });
    }

    // Ensure a valid server-side conversation exists
    let convId = conversationId || null;
    if (!convId) {
      try {
        const conv = await openai.conversations.create();
        convId = conv.id;
        console.log('[chat] created conversation', convId);
      } catch (e) {
        console.error('[chat] failed to create conversation', e);
        throw e;
      }
    }

    // We fully complete the tool loop within this turn; no carry-over from previous turns

    // Apply field updates privately before invoking the model
    let forcedTool = null;
    if (fieldUpdate && fieldUpdate.field === 'decedent_name') {
      const normalized = normalizeName(fieldUpdate.value);
      if (!normalized || normalized.length < 2) {
        return NextResponse.json({
          message: 'Please provide a valid full legal name (at least 2 characters).',
          state: {
            decedentFullName: session.decedentFullName,
            decedentDodIso: session.decedentDodIso
          },
          conversationId: convId
        });
      }
      session.decedentFullName = normalized;
      forcedTool = { type: 'function', name: 'set_decedent_name' };
    } else if (fieldUpdate && fieldUpdate.field === 'decedent_death_date') {
      const iso = parseIsoDate(fieldUpdate.value);
      if (!iso) {
        return NextResponse.json({
          message: 'Please provide a valid date of death (e.g., 2001-01-31, Jan 31 2001).',
          state: {
            decedentFullName: session.decedentFullName,
            decedentDodIso: session.decedentDodIso
          },
          conversationId: convId
        });
      }
      session.decedentDodIso = iso;
      forcedTool = { type: 'function', name: 'set_death_date' };
    }

    let response;
    try {
      response = await openai.responses.create({
        model: MODEL,
        instructions,
        tools,
        tool_choice: forcedTool || 'required',
        input,
        temperature: 0.2,
        // Use persistent conversation so OpenAI prepends prior turns automatically
        conversation: convId
      });
    } catch (e) {
      const msg = e?.message || '';
      const needsReset = msg.includes('No tool output found for function call');
      console.warn('[chat] create failed', msg);
      if (needsReset) {
        // Conversation is stuck in requires_action from an older turn; start a new one
        const conv = await openai.conversations.create();
        convId = conv.id;
        console.log('[chat] restarted conversation', convId);
        response = await openai.responses.create({
          model: MODEL,
          instructions,
          tools,
          tool_choice: 'required',
          input,
          temperature: 0.2,
          conversation: convId
        });
      } else {
        throw e;
      }
    }
    console.log('[chat] initial status', response.status, 'output_text len', (response.output_text||'').length);

    const extractToolCalls = (resp) => {
      const ra = resp.required_action?.submit_tool_outputs?.tool_calls;
      if (Array.isArray(ra) && ra.length) {
        return ra.map(c => ({ id: c.id, name: c.function?.name }));
      }
      const out = (resp.output || []).filter(o => o.type === 'function_call');
      if (out.length) {
        return out.map((o, idx) => ({ id: o.id || o.call_id || String(idx), name: o.name }));
      }
      return [];
    };

    // Execute tool calls until the model is done
    while (response.status === 'requires_action') {
      const calls = extractToolCalls(response);
      console.log('[chat] requires_action tool_calls', calls.map(c => ({ id: c.id, name: c.name })));
      const tool_outputs = [];
      for (const call of calls) {
        // Privacy: ignore model-provided arguments; use server-held values only
        let ok = false;
        if (call.name === 'set_decedent_name') {
          ok = !!session.decedentFullName && session.decedentFullName.length >= 2;
        } else if (call.name === 'set_death_date') {
          ok = !!session.decedentDodIso;
        }
        const result = ok ? { success: true } : { success: false, error_code: 'missing_value' };
        tool_outputs.push({ tool_call_id: call.id, output: JSON.stringify(result) });
      }
      console.log('[chat] submitting tool outputs', tool_outputs);
      response = await openai.responses.submitToolOutputs(response.id, { tool_outputs });
      console.log('[chat] post-submit status', response.status, 'output_text len', (response.output_text||'').length);
    }

    let outMessage = response.output_text || '';

    console.log('[chat] completed. message len', (outMessage||'').length, 'state', session);
    return NextResponse.json({
      message: outMessage,
      state: {
        decedentFullName: session.decedentFullName,
        decedentDodIso: session.decedentDodIso
      },
      conversationId: convId
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
