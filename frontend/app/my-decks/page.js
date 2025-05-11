'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getToken, removeToken } from '../lib/api';

export default function MyDecks() {
  const router = useRouter();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    apiFetch('/api/decks')
      .then((data) => setDecks(data))
      .catch((err) => {
        setError(err.message);
        if (err.message.toLowerCase().includes('authenticate')) {
          removeToken();
          router.push('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">My Presentations</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div>
          {decks.length === 0 ? (
            <div className="text-gray-600">No decks yet. <Link href="/create" className="text-blue-600 underline">Create one</Link>.</div>
          ) : (
            <ul className="space-y-4">
              {decks.map((deck) => (
                <li key={deck._id} className="p-4 bg-white rounded-lg shadow flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold">{deck.title}</div>
                    <div className="text-gray-600 text-sm">{deck.description}</div>
                  </div>
                  <Link href={`/editor?deck=${deck._id}`} className="mt-2 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 