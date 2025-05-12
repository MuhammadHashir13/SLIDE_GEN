'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '../lib/api';

export default function CreatePresentation() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    theme: 'light',
    numSlides: 5
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingSlides, setGeneratingSlides] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!getToken()) {
      router.push('/login');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      // First, create the deck
      const deckData = await apiFetch('/api/decks', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.prompt,
          theme: formData.theme
        }),
      });
      
      // Then, generate slides with Hugging Face API
      if (formData.prompt) {
        setGeneratingSlides(true);
        try {
          const slidesData = await apiFetch('/api/generate-slides', {
            method: 'POST',
            body: JSON.stringify({
              deckId: deckData._id,
              prompt: formData.prompt,
              numSlides: formData.numSlides,
              theme: formData.theme
            }),
          });
          
          // Navigate to the editor with the generated slides
          router.push(`/editor?deck=${deckData._id}`);
        } catch (err) {
          setError(`Failed to generate slides: ${err.message}`);
          // Still navigate to editor, but without generated slides
          router.push(`/editor?deck=${deckData._id}`);
        } finally {
          setGeneratingSlides(false);
        }
      } else {
        // If no prompt provided, just go to the editor
        router.push(`/editor?deck=${deckData._id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create AI-Generated Presentation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter a prompt, and our AI will generate slides for you
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="title" className="sr-only">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Presentation Title"
              />
            </div>
            <div>
              <label htmlFor="prompt" className="sr-only">
                Prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                required
                value={formData.prompt}
                onChange={(e) =>
                  setFormData({ ...formData, prompt: e.target.value })
                }
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Describe your presentation in detail (e.g., 'Create a presentation about climate change, focusing on causes, effects, and solutions')"
                rows="5"
              />
            </div>
            <div className="flex">
              <div className="w-1/2">
              <label htmlFor="theme" className="sr-only">
                Theme
              </label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value })
                }
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
                <option value="gradient">Gradient Theme</option>
              </select>
              </div>
              <div className="w-1/2">
                <label htmlFor="numSlides" className="sr-only">
                  Number of Slides
                </label>
                <select
                  id="numSlides"
                  name="numSlides"
                  value={formData.numSlides}
                  onChange={(e) =>
                    setFormData({ ...formData, numSlides: parseInt(e.target.value, 10) })
                  }
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                >
                  {[3, 5, 7, 10, 15].map(num => (
                    <option key={num} value={num}>{num} Slides</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading || generatingSlides}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Creating...' : generatingSlides ? 'Generating Slides...' : 'Create Presentation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 