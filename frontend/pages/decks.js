import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";

export default function SavedDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await fetch("/api/decks");
      if (!response.ok) throw new Error("Failed to fetch decks");
      const data = await response.json();
      setDecks(data.decks);
    } catch (error) {
      setError("Error loading slide decks");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deckId) => {
    if (!confirm("Are you sure you want to delete this deck?")) return;

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete deck");

      setDecks(decks.filter((deck) => deck._id !== deckId));
    } catch (error) {
      setError("Error deleting slide deck");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Saved Slide Decks</title>
        <meta
          name="description"
          content="View and manage your saved slide decks"
        />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Saved Slide Decks</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Deck
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : decks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No saved decks found. Create your first slide deck!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div key={deck._id} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-2">{deck.name}</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Created: {new Date(deck.createdAt).toLocaleDateString()}
                </p>
                <div className="flex justify-between items-center">
                  <Link
                    href={`/decks/${deck._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Deck
                  </Link>
                  <button
                    onClick={() => handleDelete(deck._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
