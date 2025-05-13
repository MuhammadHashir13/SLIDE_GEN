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
  const [deletingDeckIds, setDeletingDeckIds] = useState([]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadDecks();
  }, [router]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/api/decks');
      setDecks(data);
    } catch (err) {
      console.error('Error loading decks:', err);
      setError(err.message || 'Failed to load presentations');
      if (err.message && err.message.toLowerCase().includes('authenticate')) {
          removeToken();
          router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deckId) => {
    if (!confirm('Are you sure you want to delete this presentation?')) return;
    
    try {
      // Set deleting state
      setDeletingDeckIds(prev => [...prev, deckId]);
      setError('');
      
      console.log(`Attempting to delete deck with ID: ${deckId}`);
      
      // Make the API call with explicit content type
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/decks/${deckId}`;
      console.log(`DELETE request to: ${apiUrl}`);
      
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Response status: ${response.status}`);
      
      // Try to parse response as JSON even if not OK to get error details
      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
      }
      
      if (!response.ok) {
        throw new Error(responseData?.message || `Server returned status ${response.status}`);
      }
      
      console.log('Deletion successful, updating UI');
      // Update the deck list after successful deletion
      setDecks(decks.filter(deck => deck._id !== deckId));
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete: ${err.message || 'Unknown error'}`);
    } finally {
      // Clear deleting state
      setDeletingDeckIds(prev => prev.filter(id => id !== deckId));
    }
  };

  const clearError = () => {
    setError('');
  };

  return (
    <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Presentations</h1>
          <Link 
            href="/create" 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Presentation
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex justify-between items-start">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={clearError}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
      {!loading && !error && (
        <div>
          {decks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No presentations yet</h3>
                <p className="text-gray-500 mb-6">Create your first presentation to get started</p>
                <Link href="/create" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Presentation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {decks.map((deck) => (
                  <div key={deck._id} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="mb-4">
                          <h2 className="text-xl font-semibold text-gray-900 mb-1">{deck.title}</h2>
                          <p className="text-gray-600 text-sm line-clamp-2">{deck.description || 'No description'}</p>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${deck.theme === 'dark' ? 'bg-gray-800' : 'bg-blue-100'}`}>
                          <span className={deck.theme === 'dark' ? 'text-white' : 'text-blue-600'}>
                            {deck.slides?.length || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {new Date(deck.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deck.theme === 'dark' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {deck.theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link 
                          href={`/editor?deck=${deck._id}`} 
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(deck._id)}
                          disabled={deletingDeckIds.includes(deck._id)}
                          className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            deletingDeckIds.includes(deck._id)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {deletingDeckIds.includes(deck._id) ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
              ))}
              </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
} 