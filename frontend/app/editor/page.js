'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiFetch, getToken, removeToken } from '../lib/api';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function Editor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deck');
  const [deck, setDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (!deckId) {
      router.push('/my-decks');
      return;
    }
    apiFetch(`/api/decks/${deckId}`)
      .then((data) => {
        setDeck(data);
        setSlides(data.slides);
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.toLowerCase().includes('authenticate')) {
          removeToken();
          router.push('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [deckId, router]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  const handleContentChange = (content) => {
    const newSlides = [...slides];
    newSlides[currentSlide].content = content;
    setSlides(newSlides);
  };

  const handleSave = async () => {
    try {
      await apiFetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        body: JSON.stringify({ slides }),
      });
      alert('Saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerate = async () => {
    if (!deck.title || !deck.description) {
      alert('Please provide a title and description for your presentation');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          title: deck.title,
          description: deck.description,
        }),
      });
      setSlides(response.slides);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{deck.title}</h2>
        <div className="space-y-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => handleSlideChange(index)}
              className={`w-full p-2 text-left rounded ${
                currentSlide === index ? 'bg-blue-600 text-white' : 'bg-white'
              }`}
            >
              Slide {index + 1}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isGenerating ? 'Generating...' : 'Generate with AI'}
        </button>
        <button
          onClick={() => window.print()}
          className="mt-2 w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
        >
          Export PDF
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div ref={pdfRef} className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
          <ReactQuill
            value={slides[currentSlide]?.content || ''}
            onChange={handleContentChange}
            className="h-[calc(100vh-200px)]"
          />
        </div>
      </div>
    </div>
  );
} 