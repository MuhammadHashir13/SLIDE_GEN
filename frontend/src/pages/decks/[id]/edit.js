import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { decksAPI } from "../../../services/api";
import ImageUpload from "../../../components/ImageUpload";

export default function EditDeck() {
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchDeck();
    }
  }, [id]);

  const fetchDeck = async () => {
    try {
      const { data } = await decksAPI.getOne(id);
      setDeck(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching deck");
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...deck.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      [field]: value,
    };
    setDeck({ ...deck, slides: updatedSlides });
  };

  const handleImageUpload = (index, imagePath) => {
    const updatedSlides = [...deck.slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      imageUrl: imagePath,
    };
    setDeck({ ...deck, slides: updatedSlides });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      await decksAPI.update(id, deck);
      router.push(`/decks/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Error saving deck");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!deck) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Deck not found
              </h2>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push(`/decks/${id}`)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Deck
                </button>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Deck Title
                </label>
                <input
                  type="text"
                  value={deck.title}
                  onChange={(e) => setDeck({ ...deck, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-6">
                {deck.slides.map((slide, index) => (
                  <div key={index} className="border rounded-lg p-6 bg-gray-50">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Slide Title
                      </label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) =>
                          handleSlideChange(index, "title", e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Content
                      </label>
                      <textarea
                        value={slide.content}
                        onChange={(e) =>
                          handleSlideChange(index, "content", e.target.value)
                        }
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <ImageUpload
                        onImageUploaded={(imagePath) =>
                          handleImageUpload(index, imagePath)
                        }
                      />
                      {slide.imageUrl && (
                        <div className="mt-2">
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="max-h-48 rounded-lg"
                          />
                          <button
                            onClick={() => handleImageUpload(index, null)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
