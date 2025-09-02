'use client';

import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "I’m here to help with the intake. First, what is the decedent’s full legal name as it appears on the death certificate?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Minimal intake state (client source of truth for now)
  const [intake, setIntake] = useState({
    decedentFullName: '',
    decedentDodIso: ''
  });
  const [conversationId, setConversationId] = useState(null);

  const progress = {
    hasDecedentName: !!intake.decedentFullName,
    hasDeathDate: !!intake.decedentDodIso
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    try {
      // Privacy-aware: map the current step to a fieldUpdate instead of sending raw text
      let fieldUpdate = null;
      if (!intake.decedentFullName) {
        fieldUpdate = { field: 'decedent_name', value: userText };
      } else if (!intake.decedentDodIso) {
        fieldUpdate = { field: 'decedent_death_date', value: userText };
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: fieldUpdate ? undefined : userText, fieldUpdate, state: intake, conversationId })
      });
      const data = await res.json();
      if (data?.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
      if (data?.state) {
        setIntake(prev => ({ ...prev, ...data.state }));
      }
      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }
      // No responseId tracking needed; server completes each turn
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I hit an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Utah Intake</h1>
          <p className="text-gray-600">We’ll collect name, then date of death.</p>
        </div>

        <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className={progress.hasDecedentName ? 'text-green-600' : 'text-gray-500'}>
              ✓ Decedent Name {progress.hasDecedentName ? `: ${intake.decedentFullName}` : ''}
            </span>
            <span className={progress.hasDeathDate ? 'text-green-600' : 'text-gray-500'}>
              ✓ Date of Death {progress.hasDeathDate ? `: ${intake.decedentDodIso}` : ''}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">Thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-900 rounded-lg p-4 text-white">
            <h3 className="font-medium mb-2">State (Dev Only)</h3>
            <pre className="text-xs overflow-x-auto">{JSON.stringify(intake, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
