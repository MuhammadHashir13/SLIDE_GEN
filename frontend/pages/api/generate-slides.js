import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getPromptForSlideType = (slideType, content) => {
  const basePrompt = `Create a ${slideType} presentation outline for the following content. 
Format the response with clear slide titles and bullet points. 
Each slide should be separated by a blank line.
Make it professional and engaging. Content: ${content}`;

  switch (slideType) {
    case 'business':
      return `${basePrompt} Focus on business metrics, goals, and actionable insights.`;
    case 'academic':
      return `${basePrompt} Include research findings, methodology, and academic references.`;
    case 'pitch':
      return `${basePrompt} Emphasize problem statement, solution, market opportunity, and call to action.`;
    default:
      return basePrompt;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { content, slideType, theme } = req.body;

    if (!content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const prompt = getPromptForSlideType(slideType, content);

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const slides = processContentIntoSides(completion.data.choices[0].text, theme);
    res.status(200).json({ slides });
  } catch (error) {
    console.error("Error generating slides:", error);
    res.status(500).json({ message: "Error generating slides" });
  }
}

function processContentIntoSides(content, theme) {
  // Split content into slides based on sections
  const sections = content.split("\n\n").filter(section => section.trim());
  
  return sections.map((section, index) => {
    const lines = section.split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim(); // Remove markdown headers
    const content = lines.slice(1).join('\n').trim();

    return {
      id: index + 1,
      title,
      content,
      theme,
      type: index === 0 ? "title" : "content",
    };
  });
}
