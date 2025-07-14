import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestChat() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const testDirectChat = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: message || 'Hello' }
          ],
          stream: false
        })
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  const testRequestOp = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/requestOp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            method: 'GET',
            path: '/assistant/',
            op: 'list'
          }
        })
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Session: {session ? 'Logged in' : 'Not logged in'}</p>
        <p>Auth Disabled: {process.env.NEXT_PUBLIC_AUTH_DISABLED}</p>
        <p>Mock API: {process.env.NEXT_PUBLIC_USE_MOCK_API}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message"
          style={{ width: '300px', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testDirectChat} disabled={loading} style={{ marginRight: '10px' }}>
          Test Direct Chat
        </button>
        <button onClick={testRequestOp} disabled={loading}>
          Test RequestOp
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {loading ? 'Loading...' : response}
      </div>
    </div>
  );
}