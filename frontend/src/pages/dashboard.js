import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { slidesAPI, decksAPI } from "../services/api";
import ImageUpload from "../components/ImageUpload";

export default function Dashboard() {
  const [content, setContent] = useState("");
  const [slideType, setSlideType] = useState("business");
  const [theme, setTheme] = useState("modern");
  const [template, setTemplate] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedSlides, setGeneratedSlides] = useState(null);
  const [saving, setSaving] = useState(false);
  const [decks, setDecks] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const { data } = await decksAPI.getAll();
      setDecks(data);
    } catch (err) {
      console.error("Error fetching decks:", err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await slidesAPI.generate({
        content,
        slideType,
        theme,
      });

      // Add image URLs to slides if they exist
      const slidesWithImages = data.slides.map((slide, index) => ({
        ...slide,
        imageUrl: selectedImages[index] || null,
      }));

      setGeneratedSlides(slidesWithImages);
    } catch (err) {
      setError(err.response?.data?.message || "Error generating slides");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (slideIndex, imagePath) => {
    setSelectedImages((prev) => ({
      ...prev,
      [slideIndex]: imagePath,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const deckData = {
        title: content.substring(0, 50) + "...",
        slides: generatedSlides,
        userId: user.id,
      };

      await decksAPI.create(deckData);
      await fetchDecks();
      setGeneratedSlides(null);
      setContent("");
      setSelectedImages({});
    } catch (err) {
      setError(err.response?.data?.message || "Error saving deck");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">Slide Generator</h1>
              </div>
              <div className="flex items-center">
                <span className="mr-4">Welcome, {user?.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Input Form */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Generate Slides</h2>
                <form onSubmit={handleGenerate}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Content
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your presentation content..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Slide Type
                        </label>
                        <select
                          value={slideType}
                          onChange={(e) => setSlideType(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="business">Business</option>
                          <option value="academic">Academic</option>
                          <option value="creative">Creative</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Theme
                        </label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="modern">Modern</option>
                          <option value="classic">Classic</option>
                          <option value="minimal">Minimal</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? "Generating..." : "Generate Slides"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Generated Slides Preview */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">Preview</h2>
                {error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                {generatedSlides && (
                  <div className="space-y-4">
                    {generatedSlides.map((slide, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <h3 className="font-medium">{slide.title}</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {slide.content}
                        </p>
                        <div className="mb-4">
                          <ImageUpload
                            onImageUploaded={(imagePath) =>
                              handleImageUpload(index, imagePath)
                            }
                          />
                          {selectedImages[index] && (
                            <div className="mt-2">
                              <img
                                src={selectedImages[index]}
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
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Deck"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Decks */}
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-4">Your Decks</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium">{deck.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {deck.slides.length} slides
                    </p>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => router.push(`/decks/${deck._id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/decks/${deck._id}/edit`)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Edit
                      </button>
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
