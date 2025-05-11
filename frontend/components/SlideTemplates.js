const SlideTemplates = ({ onSelectTemplate }) => {
  const templates = [
    {
      id: "title",
      name: "Title Slide",
      description: "Perfect for presentation title and subtitle",
      layout: "title",
    },
    {
      id: "bullet",
      name: "Bullet Points",
      description: "Classic bullet point layout",
      layout: "bullet",
    },
    {
      id: "split",
      name: "Split Layout",
      description: "Text and image side by side",
      layout: "split",
    },
    {
      id: "quote",
      name: "Quote",
      description: "Highlight important quotes or statistics",
      layout: "quote",
    },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Slide Templates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <h4 className="font-medium text-gray-900">{template.name}</h4>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlideTemplates;
