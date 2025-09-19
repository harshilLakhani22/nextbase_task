'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Ensure cookies are sent and set
      });
      const data = await res.json();
      if (res.ok && data.success) {
        try {
          router.push('/dashboard');
        } catch {
          window.location.href = '/dashboard';
        }
      } else {
        setError(data.error || 'Signup failed');
        console.error('Signup error:', data);
      }
    } catch (err) {
      setError('Network error');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSignup} className="bg-white p-6 rounded shadow w-80 space-y-4">
        <h2 className="text-xl font-bold">Sign Up</h2>
        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-black text-white py-2 rounded" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <a href="/auth/login" className="text-sm text-blue-600 hover:underline">Login</a>
      </form>
    </div>
  );
}
