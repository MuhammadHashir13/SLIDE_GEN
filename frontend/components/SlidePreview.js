import { useRef } from "react";
import html2pdf from "html2pdf.js";

const SlidePreview = ({ slides, theme }) => {
  const slideRef = useRef(null);

  const getThemeClasses = (theme) => {
    switch (theme) {
      case "dark":
        return "bg-gray-900 text-white";
      case "gradient":
        return "bg-gradient-to-br from-blue-500 to-purple-600 text-white";
      default:
        return "bg-white text-gray-900";
    }
  };

  const exportToPDF = async () => {
    const element = slideRef.current;
    const opt = {
      margin: 1,
      filename: "presentation.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Preview</h2>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Export to PDF
        </button>
      </div>

      <div ref={slideRef} className="space-y-4">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className={`p-8 rounded-lg shadow-lg ${getThemeClasses(theme)}`}
            style={{ aspectRatio: "16/9" }}
          >
            {slide.type === "title" ? (
              <div className="h-full flex flex-col justify-center items-center text-center">
                <h1 className="text-4xl font-bold mb-4">{slide.content}</h1>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <div className="prose max-w-none">
                  {slide.content.split("\n").map((line, index) => (
                    <p key={index} className="mb-2">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlidePreview;
