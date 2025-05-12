const express = require('express');
const router = express.Router();
const Slide = require('../models/Slide');
const Deck = require('../models/Deck');
const auth = require('../middleware/auth');
const fetch = require('node-fetch'); // Make sure to install this package if not already installed

// No longer using the Google Generative AI SDK
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

// Generate multiple slides from a single prompt
router.post('/', auth, async (req, res) => {
  try {
    const { deckId, prompt, numSlides, theme } = req.body;

    // Check if deck exists and belongs to user
    const deck = await Deck.findOne({ _id: deckId, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    console.log(`Generating ${numSlides} slides for deck "${deck.title}" with prompt: "${prompt}"`);

    // Generate slides using Gemini API
    const slidesData = await generateSlidesUsingGemini(deck.title, prompt, numSlides, theme);
    console.log(`Successfully generated ${slidesData.length} slides using Gemini API`);
    
    // Create the slides in the database
    const slidePromises = slidesData.map(async (slideData, index) => {
      // Determine slide type based on position
      let type = 'text'; // Default to text
      if (index === 0) type = 'title';
      else if (index === slidesData.length - 1) type = 'text'; // Use text for conclusion
      
      // Use valid layout values from the Slide model
      const layout = index === 0 ? 'title' : 'full-width';
      
      const slide = new Slide({
        title: slideData.title || `Slide ${index + 1}`,
        content: slideData.content || '',
        type,
        theme: deck.theme,
        layout,
        order: index,
        deck: deckId
      });

      await slide.save();
      return slide._id;
    });

    const slideIds = await Promise.all(slidePromises);

    // Update the deck with the new slides
    deck.slides = slideIds;
    await deck.save();

    console.log(`Successfully created ${slideIds.length} slides for deck "${deck.title}"`);

    res.status(201).json({ 
      message: 'Slides generated successfully',
      slideCount: slideIds.length 
    });
  } catch (error) {
    console.error('Slide generation error:', error);
    res.status(500).json({ 
      message: 'Error generating slides', 
      error: error.message 
    });
  }
});

// Generate slides using Google Gemini API with direct fetch
async function generateSlidesUsingGemini(title, prompt, numSlides, theme) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || 'your-api-key-here';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Check if API key is missing or placeholder
    if (!apiKey || apiKey === 'your-api-key-here') {
      console.error("Missing or invalid API key");
      throw new Error("Gemini API key is missing or invalid");
    }
    
    const systemPrompt = `You are a professional presentation creator. 
Your task is to create EXACTLY ${numSlides} presentation slides about "${prompt}". 
The title of the presentation is "${title}".

Each slide should have:
1. A clear, concise title
2. Properly formatted content with HTML styling
3. Relevant information that's factually accurate, NEVER use generic placeholder text
4. Professional tone and language

The slides should include:
- A title slide (first slide)
- Content slides with key information
- A conclusion/summary slide (last slide) with SPECIFIC information related to the topic, not generic placeholders

Use proper HTML formatting with inline CSS styling for a professional appearance.
Wrap each slide's content in a div with padding and styling.
Use these style guidelines for ALL slides:
- Font sizes: 48px for main heading, 36px for slide titles, 24px for main text, 20px for bullet points
- Colors: #1e40af (dark blue) for headings, #334155 (slate) for body text
- Layout: Center titles, left-align content with proper spacing
- Padding: 60px padding on all sides
- Width: 100% width to fill the slide
- Use flexbox to center content vertically
- Add background color #f8fafc (very light gray) to the slide

IMPORTANT: Your response MUST include EXACTLY ${numSlides} slides, no more and no less.
IMPORTANT: The conclusion slide MUST contain specific details about ${title}, not generic placeholders.
IMPORTANT: Never use placeholders like "Highlighted benefit or feature" or "Important conclusion point".

Example slide content format:
{
  "title": "Slide Title",
  "content": "<div style='display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;'><h2 style='font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;'>Heading</h2><p style='font-size: 24px; margin-bottom: 25px; color: #334155;'>Description text</p><ul style='font-size: 20px; margin-left: 30px; color: #334155;'><li style='margin-bottom: 15px;'>Point 1</li><li style='margin-bottom: 15px;'>Point 2</li></ul></div>"
}

Your response should be a valid JSON array of exactly ${numSlides} slide objects.`;

    const userPrompt = `Create EXACTLY ${numSlides} detailed slides about "${prompt}" with the title "${title}" using a ${theme} theme. Include specific details for all slides, especially the conclusion slide. Never use generic placeholders.`;
    
    // Prepare the request body
    const requestBody = {
      contents: [{
        parts: [
          { text: systemPrompt + "\n\n" + userPrompt }
        ]
      }]
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, log and throw error
      const text = await response.text();
      console.error('Received non-JSON response:', text.substring(0, 500) + '...');
      throw new Error('API returned non-JSON response');
    }
    
    const data = await response.json();
    
    // Extract the text from the response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Gemini API Response (sample):", responseText.substring(0, 200) + "...");
    
    // Look for JSON in the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                    responseText.match(/```\n([\s\S]*?)\n```/) ||
                    responseText.match(/{[\s\S]*?}/);
    
    let jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    
    // Clean up the JSON string
    jsonContent = jsonContent.replace(/```json|```/g, '').trim();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonContent);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      console.error("Attempted to parse:", jsonContent);
      
      // Try to find an array in the response
      const arrayMatch = responseText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (arrayMatch) {
        try {
          parsedResponse = JSON.parse(arrayMatch[0]);
        } catch (arrayError) {
          console.error("Array parse error:", arrayError);
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }
    
    // Process the slides from the response
    let slides;
    if (Array.isArray(parsedResponse.slides)) {
      slides = parsedResponse.slides;
    } else if (Array.isArray(parsedResponse)) {
      slides = parsedResponse;
    } else if (typeof parsedResponse === 'object') {
      // Try to extract slides from object properties
      slides = [];
      Object.keys(parsedResponse).forEach(key => {
        if (key.startsWith('slide') && typeof parsedResponse[key] === 'object') {
          slides.push(parsedResponse[key]);
        }
      });
    }
    
    // Make sure we have exactly the requested number of slides
    if (!slides || !Array.isArray(slides)) {
      throw new Error(`Invalid slide format returned from AI model`);
    }
    
    // If we don't have enough slides, make another API call to get more
    if (slides.length < numSlides) {
      throw new Error(`AI generated only ${slides.length} slides, but ${numSlides} were requested`);
    }
    
    // If we have too many slides, trim to the exact number requested
    if (slides.length > numSlides) {
      slides = slides.slice(0, numSlides);
    }
    
    return slides;
  } catch (error) {
    console.error("Error using Gemini API:", error);
    throw error;
  }
}

// Extract slides from various potential response formats
function extractSlidesFromResponse(parsedResponse, numSlides, title) {
  // Check various possible response formats
  if (Array.isArray(parsedResponse)) {
    return parsedResponse; // Direct array of slides
  }
  
  if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
    return parsedResponse.data;
  }
  
  if (parsedResponse.slides && Array.isArray(parsedResponse.slides)) {
    return parsedResponse.slides;
  }
  
  if (parsedResponse.content && Array.isArray(parsedResponse.content)) {
    return parsedResponse.content;
  }
  
  // If no proper array found, try to construct from object properties
  const slides = [];
  let slideCount = 0;
  
  // Look for properties like slide1, slide2, etc.
  Object.keys(parsedResponse).forEach(key => {
    if (key.startsWith('slide') && slideCount < numSlides) {
      if (typeof parsedResponse[key] === 'object') {
        slides.push(parsedResponse[key]);
      } else {
        // If it's just a string, try to create a slide object
        slides.push({
          title: `Slide ${slideCount + 1}`,
          content: parsedResponse[key]
        });
      }
      slideCount++;
    }
  });
  
  // If we found slides, return them
  if (slides.length > 0) {
    return slides;
  }
  
  // Last resort: create a fallback with the data we have
  console.warn("Could not extract slides from response, using fallback");
  return createBasicSlideStructure(title, numSlides, parsedResponse.toString());
}

// Helper function to create a basic slide structure
function createBasicSlideStructure(deckTitle, numSlides, prompt) {
  // Generate more meaningful content based on common topics
  const topics = extractTopicsFromPrompt(prompt);
  const cleanTitle = deckTitle.trim();
  
  // Create a more informative first slide
  const slides = [
    { 
      title: cleanTitle, 
      content: `<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h1 style="font-size: 48px; margin-bottom: 40px; color: #1e40af; text-align: center;">${cleanTitle}</h1>
  <p style="font-size: 24px; margin-bottom: 40px; color: #334155; text-align: center;">An overview and introduction</p>
  <ul style="font-size: 22px; list-style-type: none; max-width: 800px; margin: 0 auto; color: #334155;">
    <li style="margin-bottom: 20px; padding-left: 30px; position: relative;">
      <span style="position: absolute; left: 0; color: #2563eb;">➤</span> Key features and highlights
    </li>
    <li style="margin-bottom: 20px; padding-left: 30px; position: relative;">
      <span style="position: absolute; left: 0; color: #2563eb;">➤</span> Why ${cleanTitle} stands out
    </li>
    <li style="margin-bottom: 20px; padding-left: 30px; position: relative;">
      <span style="position: absolute; left: 0; color: #2563eb;">➤</span> What we'll cover in this presentation
    </li>
  </ul>
</div>`
    }
  ];
  
  // Choose appropriate slide types based on the topic
  const slideTemplates = getTopicSpecificTemplates(cleanTitle, topics);
  
  // Add content slides based on the number requested
  const contentSlideCount = numSlides - 2; // Subtract title and conclusion
  
  for (let i = 0; i < contentSlideCount; i++) {
    if (i < slideTemplates.length) {
      slides.push(slideTemplates[i]);
    } else if (i < topics.length) {
      slides.push({ 
        title: titleCase(topics[i]), 
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">${titleCase(topics[i])}</h2>
  <p style="font-size: 24px; margin-bottom: 25px; color: #334155;">Key information about ${topics[i]}:</p>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Important feature or detail</li>
    <li style="margin-bottom: 20px;">Relevant statistics or data</li>
    <li style="margin-bottom: 20px;">Competitive advantages</li>
    <li style="margin-bottom: 20px;">User benefits</li>
  </ul>
</div>`
      });
    } else {
      slides.push({ 
        title: `Key Aspect ${i + 1}`, 
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Important Information</h2>
  <p style="font-size: 24px; margin-bottom: 25px; color: #334155;">Details about ${cleanTitle}:</p>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Feature point or specification</li>
    <li style="margin-bottom: 20px;">User benefit or advantage</li>
    <li style="margin-bottom: 20px;">Supporting data or information</li>
  </ul>
</div>`
      });
    }
  }
  
  // Add a more detailed conclusion
  slides.push({ 
    title: "Summary & Conclusion", 
    content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Summary</h2>
  <p style="font-size: 24px; margin-bottom: 25px; color: #334155;">Key takeaways about ${cleanTitle}:</p>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Highlighted benefit or feature</li>
    <li style="margin-bottom: 20px;">Important conclusion point</li>
    <li style="margin-bottom: 20px;">Call to action or next steps</li>
  </ul>
  <p style="font-size: 24px; margin-top: 40px; text-align: center; color: #334155;">Thank you for your attention!</p>
</div>`
  });
  
  return slides;
}

// Convert text to Title Case
function titleCase(text) {
  return text.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Get slide templates specific to the topic
function getTopicSpecificTemplates(title, topics) {
  const cleanTitle = title.toLowerCase();
  
  // Car or vehicle related templates
  if (cleanTitle.includes('car') || 
      cleanTitle.includes('vehicle') || 
      cleanTitle.includes('tesla') || 
      cleanTitle.includes('model') ||
      cleanTitle.includes('auto')) {
    return [
      {
        title: "Performance & Specifications",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Performance & Specifications</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Engine/Motor specifications and power output</li>
    <li style="margin-bottom: 20px;">Acceleration and top speed</li>
    <li style="margin-bottom: 20px;">Range and efficiency metrics</li>
    <li style="margin-bottom: 20px;">Charging capabilities (if electric)</li>
  </ul>
</div>`
      },
      {
        title: "Design & Features",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Design & Features</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Exterior design highlights</li>
    <li style="margin-bottom: 20px;">Interior comfort and space</li>
    <li style="margin-bottom: 20px;">Technology and infotainment</li>
    <li style="margin-bottom: 20px;">Safety features and ratings</li>
  </ul>
</div>`
      },
      {
        title: "Technology & Innovation",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Technology & Innovation</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Advanced driver assistance systems</li>
    <li style="margin-bottom: 20px;">Connectivity features</li>
    <li style="margin-bottom: 20px;">Software capabilities and updates</li>
    <li style="margin-bottom: 20px;">Unique technological advantages</li>
  </ul>
</div>`
      },
      {
        title: "Pricing & Availability",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Pricing & Availability</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Starting price and trim levels</li>
    <li style="margin-bottom: 20px;">Available options and packages</li>
    <li style="margin-bottom: 20px;">Release date and production information</li>
    <li style="margin-bottom: 20px;">Market availability and competition</li>
  </ul>
</div>`
      }
    ];
  }
  
  // Technology product templates
  if (cleanTitle.includes('tech') || 
      cleanTitle.includes('product') || 
      cleanTitle.includes('device') || 
      cleanTitle.includes('software')) {
    return [
      {
        title: "Key Features",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Key Features</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Primary functionality and capabilities</li>
    <li style="margin-bottom: 20px;">Unique selling points</li>
    <li style="margin-bottom: 20px;">Technical specifications</li>
    <li style="margin-bottom: 20px;">User experience highlights</li>
  </ul>
</div>`
      },
      {
        title: "Use Cases & Applications",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Use Cases & Applications</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Primary user scenarios</li>
    <li style="margin-bottom: 20px;">Industry applications</li>
    <li style="margin-bottom: 20px;">Problem-solving capabilities</li>
    <li style="margin-bottom: 20px;">Integration with existing systems</li>
  </ul>
</div>`
      },
      {
        title: "Benefits & Advantages",
        content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Benefits & Advantages</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Performance improvements</li>
    <li style="margin-bottom: 20px;">Cost or time savings</li>
    <li style="margin-bottom: 20px;">Competitive advantages</li>
    <li style="margin-bottom: 20px;">User satisfaction metrics</li>
  </ul>
</div>`
      }
    ];
  }
  
  // Generic business templates
  return [
    {
      title: "Overview & Background",
      content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Overview & Background</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">History and development</li>
    <li style="margin-bottom: 20px;">Key milestones and achievements</li>
    <li style="margin-bottom: 20px;">Market position and relevance</li>
    <li style="margin-bottom: 20px;">Core principles or values</li>
  </ul>
</div>`
    },
    {
      title: "Key Features & Benefits",
      content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Key Features & Benefits</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Primary features or components</li>
    <li style="margin-bottom: 20px;">Main advantages and benefits</li>
    <li style="margin-bottom: 20px;">Unique selling propositions</li>
    <li style="margin-bottom: 20px;">Value to users or customers</li>
  </ul>
</div>`
    },
    {
      title: "Applications & Use Cases",
      content: `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Applications & Use Cases</h2>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Practical applications</li>
    <li style="margin-bottom: 20px;">Real-world examples</li>
    <li style="margin-bottom: 20px;">Success stories or case studies</li>
    <li style="margin-bottom: 20px;">Industry or sector relevance</li>
  </ul>
</div>`
    }
  ];
}

// Helper function to extract potential topics from the prompt
function extractTopicsFromPrompt(prompt) {
  // Simple approach: look for keywords like "about", "including", "such as", "like"
  const topicMatches = prompt.match(/(?:about|including|such as|like) ([\w\s,]+)/gi);
  if (!topicMatches) return [];
  
  // Extract topics and split by commas if present
  let topics = [];
  topicMatches.forEach(match => {
    const cleaned = match.replace(/(?:about|including|such as|like) /i, '');
    const parts = cleaned.split(/,|\band\b/).map(t => t.trim());
    topics = [...topics, ...parts];
  });
  
  // If we failed to extract topics, try to split the prompt into phrases
  if (topics.length === 0) {
    topics = prompt.split(/[,.;]/).map(t => t.trim()).filter(t => t.length > 0 && t.split(' ').length <= 5);
  }
  
  return topics.filter(t => t.length > 0);
}

// Ensure we have exactly the requested number of slides
function ensureCorrectSlideCount(slidesData, numSlides, deckTitle, prompt) {
  const cleanTitle = deckTitle.trim();
  
  // If we have too few slides, add more
  if (slidesData.length < numSlides) {
    const topics = extractTopicsFromPrompt(prompt);
    const slideTemplates = getTopicSpecificTemplates(cleanTitle, topics);
    let topicIndex = 0;
    let templateIndex = 0;
    
    while (slidesData.length < numSlides) {
      // First try to use remaining templates
      if (templateIndex < slideTemplates.length) {
        const templateNotUsed = !slidesData.some(slide => 
          slide.title === slideTemplates[templateIndex].title);
          
        if (templateNotUsed) {
          slidesData.push(slideTemplates[templateIndex]);
        }
        templateIndex++;
      }
      // Then try to use topics
      else if (topicIndex < topics.length) {
        const topicTitle = titleCase(topics[topicIndex]);
        slidesData.push({ 
          title: topicTitle, 
          content: `<div style="padding: 40px; height: 100%;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af;">${topicTitle}</h2>
  <p style="font-size: 24px; margin-bottom: 25px;">Key information about ${topics[topicIndex]}:</p>
  <ul style="font-size: 22px; margin-left: 30px;">
    <li style="margin-bottom: 15px;">Important feature or detail</li>
    <li style="margin-bottom: 15px;">Relevant statistics or data</li>
    <li style="margin-bottom: 15px;">Competitive advantages</li>
    <li style="margin-bottom: 15px;">User benefits</li>
  </ul>
</div>`
        });
        topicIndex++;
      } 
      // Finally, use generic slides
      else {
        const slideNumber = slidesData.length + 1;
        slidesData.push({ 
          title: `Additional Point ${slideNumber}`, 
          content: `<div style="padding: 40px; height: 100%;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af;">Additional Information</h2>
  <p style="font-size: 24px; margin-bottom: 25px;">More details about ${cleanTitle}:</p>
  <ul style="font-size: 22px; margin-left: 30px;">
    <li style="margin-bottom: 15px;">Additional specifications or features</li>
    <li style="margin-bottom: 15px;">More benefits or advantages</li>
    <li style="margin-bottom: 15px;">Related information or context</li>
  </ul>
</div>`
        });
      }
    }
  }
  
  // If we have too many slides, trim
  if (slidesData.length > numSlides) {
    // Keep the first slide (title) and last slide (conclusion)
    // and select the most relevant middle slides
    if (numSlides >= 3) {
      const firstSlide = slidesData[0];
      const lastSlide = slidesData[slidesData.length - 1];
      const middleSlides = slidesData.slice(1, -1)
                                     .slice(0, numSlides - 2);
      slidesData = [firstSlide, ...middleSlides, lastSlide];
    } else {
      slidesData = slidesData.slice(0, numSlides);
    }
  }
  
  // Ensure the first slide is a title slide with proper formatting
  if (slidesData.length > 0) {
    slidesData[0].title = cleanTitle;
    slidesData[0].content = `<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h1 style="font-size: 48px; margin-bottom: 40px; color: #1e40af; text-align: center;">${cleanTitle}</h1>
  <p style="font-size: 24px; margin-bottom: 40px; color: #334155; text-align: center;">An overview and introduction</p>
  <ul style="font-size: 22px; list-style-type: none; max-width: 800px; margin: 0 auto; color: #334155;">
    <li style="margin-bottom: 20px; padding-left: 30px; position: relative;">
      <span style="position: absolute; left: 0; color: #2563eb;">➤</span> Key features and highlights
    </li>
    <li style="margin-bottom: 20px; padding-left: 30px; position: relative;">
      <span style="position: absolute; left: 0; color: #2563eb;">➤</span> Why ${cleanTitle} stands out
    </li>
    <li style="margin-bottom: 20px; padding-left: 30px; position: relative;">
      <span style="position: absolute; left: 0; color: #2563eb;">➤</span> What we'll cover in this presentation
    </li>
  </ul>
</div>`;
  }
  
  // Ensure the last slide is a conclusion with proper formatting
  if (slidesData.length > 1) {
    slidesData[slidesData.length - 1].title = "Summary & Conclusion";
    slidesData[slidesData.length - 1].content = `<div style="display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: #f8fafc; font-family: Arial, sans-serif;">
  <h2 style="font-size: 36px; margin-bottom: 30px; color: #1e40af; text-align: center;">Summary</h2>
  <p style="font-size: 24px; margin-bottom: 25px; color: #334155;">Key takeaways about ${cleanTitle}:</p>
  <ul style="font-size: 22px; margin-left: 40px; color: #334155;">
    <li style="margin-bottom: 20px;">Highlighted benefit or feature</li>
    <li style="margin-bottom: 20px;">Important conclusion point</li>
    <li style="margin-bottom: 20px;">Call to action or next steps</li>
  </ul>
  <p style="font-size: 24px; margin-top: 40px; text-align: center; color: #334155;">Thank you for your attention!</p>
</div>`;
  }
  
  return slidesData;
}

module.exports = router; 