'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test health endpoint
      const response = await fetch('/api/health');
      const data = await response.json();
      setResult('Health check: ' + JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@eventregistration.com',
          password: 'password123'
        })
      });
      const data = await response.json();
      setResult('Login test: ' + JSON.stringify(data));
    } catch (error) {
      setResult('Login error: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">API Test Page</h1>
      <div className="space-x-4 mb-4">
        <button 
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Health API
        </button>
        <button 
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Login API
        </button>
      </div>
      <div className="bg-gray-100 p-4 rounded">
        <pre>{loading ? 'Loading...' : result}</pre>
      </div>
    </div>
  );
}