import React, { useState } from 'react';

const ALLOWED_MODELS = ['minimaxminimax/minimax-m2.5:free']; // display-only

export default function AIDocsForm() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [model] = useState(ALLOWED_MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch('/api/v1/ai/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Server error');
      setResult(data.documentation);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Code</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Language
          <input value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginTop: 6 }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Model
          <select value={model} disabled style={{ marginTop: 6 }}>
            {ALLOWED_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <small style={{ color: '#666' }}>Server enforces this model</small>
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button type="submit" disabled={!code || loading} style={{ padding: '8px 14px' }}>
          {loading ? 'Generating…' : 'Generate Docs'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 12 }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div>
          <h3>Generated Documentation</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12 }}>{result}</pre>
        </div>
      )}
    </form>
  );
}
