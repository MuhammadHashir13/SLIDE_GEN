import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../../components/ProtectedRoute";
import { decksAPI } from "../../services/api";

export default function DeckView() {
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this deck?")) {
      try {
        await decksAPI.delete(id);
        router.push("/dashboard");
      } catch (err) {
        setError(err.response?.data?.message || "Error deleting deck");
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await decksAPI.exportPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${deck.title.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || "Error exporting deck");
    } finally {
      setExporting(false);
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
                  onClick={() => router.push("/dashboard")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {exporting ? "Exporting..." : "Export PDF"}
                </button>
                <button
                  onClick={() => router.push(`/decks/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {deck.title}
              </h1>
              <div className="space-y-8">
                {deck.slides.map((slide, index) => (
                  <div key={index} className="border rounded-lg p-6 bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {slide.title}
                    </h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-600">{slide.content}</p>
                    </div>
                    {slide.imageUrl && (
                      <div className="mt-4">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="max-h-96 rounded-lg"
                        />
                      </div>
                    )}
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
