'use client';

import { useState } from 'react';

export default function AINameAssistant({ onExtract }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/extract-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Extraction failed');
      const name = (data?.name || '').trim();
      if (!name) {
        setError('Could not find a clear name. Try rephrasing.');
        return;
      }
      onExtract?.(name);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Use AI to extract the name</h3>
        <span className="text-xs text-gray-500">Optional</span>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        Paste or describe the situation (e.g., &ldquo;My mother, Jane Q. Doe, passed away...&rdquo;).
        The assistant will pull out the decedent&rsquo;s name and fill it in.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        placeholder="Type or paste here..."
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleExtract}
          disabled={loading || !text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Extracting…' : 'Extract Name'}
        </button>
        <button
          onClick={() => { setText(''); setError(''); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
      <p className="text-[11px] text-gray-500 mt-3">
        Note: For privacy, avoid sensitive identifiers. Provider can be OpenAI or a local model; see environment settings.
      </p>
    </div>
  );
}

