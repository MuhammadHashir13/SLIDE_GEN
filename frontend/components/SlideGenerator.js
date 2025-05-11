import { useState } from "react";
import SlidePreview from "./SlidePreview";
import SlideTemplates from "./SlideTemplates";

const SlideGenerator = () => {
  const [slideType, setSlideType] = useState("business");
  const [theme, setTheme] = useState("light");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deckName, setDeckName] = useState("");

  const slideTypes = [
    { id: "business", name: "Business" },
    { id: "academic", name: "Academic" },
    { id: "pitch", name: "Pitch Deck" },
  ];

  const themes = [
    { id: "light", name: "Light" },
    { id: "dark", name: "Dark" },
    { id: "gradient", name: "Gradient" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          slideType,
          theme,
          template: selectedTemplate?.layout,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }
      
      const data = await response.json();
      setSlides(data.slides);
    } catch (error) {
      console.error("Error generating slides:", error);
      setError("Failed to generate slides. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      setError("Please enter a name for your slide deck");
      return;
    }

    try {
      const response = await fetch("/api/save-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deckName,
          slides,
          theme,
          slideType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save slide deck');
      }

      setDeckName("");
      alert("Slide deck saved successfully!");
    } catch (error) {
      console.error("Error saving slide deck:", error);
      setError("Failed to save slide deck. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Slide Type
            </label>
            <select
              value={slideType}
              onChange={(e) => setSlideType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {slideTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
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
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your content here..."
            />
          </div>

          <SlideTemplates onSelectTemplate={setSelectedTemplate} />

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Slides"}
            </button>
          </div>
        </form>
      </div>

      {slides.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter slide deck name"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveDeck}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save Deck
            </button>
          </div>
          <SlidePreview slides={slides} theme={theme} />
        </div>
      )}
    </div>
  );
};

export default SlideGenerator;
