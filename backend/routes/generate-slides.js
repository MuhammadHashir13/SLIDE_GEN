const express = require('express');
const router = express.Router();
const Slide = require('../models/Slide');
const Deck = require('../models/Deck');
const auth = require('../middleware/auth');
const fetch = require('node-fetch'); // Make sure to install this package if not already installed

// Add Unsplash API client configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_SECRET_KEY = process.env.UNSPLASH_SECRET_KEY;

// Default fallback images by category - use these if API fails
const FALLBACK_IMAGES = {
  business: 'https://images.unsplash.com/photo-1664575599736-c5197c684172?w=800',
  technology: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
  nature: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  travel: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  health: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800',
  science: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800',
  art: 'https://images.unsplash.com/photo-1579783483458-83d02161294e?w=800',
  music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
  finance: 'https://images.unsplash.com/photo-1565514501303-256e0ea65d49?w=800',
  history: 'https://images.unsplash.com/photo-1461360370896-8a6edf403f35?w=800',
  fashion: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800',
  architecture: 'https://images.unsplash.com/photo-1481253127861-534498168948?w=800',
  cars: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
  space: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
  animals: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800',
  gaming: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
  politics: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800',
  religion: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800',
  entertainment: 'https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?w=800',
  military: 'https://images.unsplash.com/photo-1564217296983-04f9af98c33c?w=800',
  innovation: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
  motivation: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=800',
  leadership: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  climate: 'https://images.unsplash.com/photo-1593990965209-125a37c20ca5?w=800',
  development: 'https://images.unsplash.com/photo-1589793907316-f94025b52665?w=800',
  communication: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
  default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
};

// Generate multiple slides from a single prompt
router.post('/', auth, async (req, res) => {
  try {
    const { deckId, prompt, numSlides, theme, transition } = req.body;

    // Default transition if not provided
    const slideTransition = transition || 'fade';

    // Add debugging to log the theme
    console.log(`Requested theme: ${theme}, type: ${typeof theme}`);
    console.log(`Requested transition: ${slideTransition}`);

    // Check if deck exists and belongs to user
    const deck = await Deck.findOne({ _id: deckId, user: req.user._id });
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Use the provided theme or fall back to the deck's theme if not provided
    const slideTheme = theme || deck.theme || 'light';
    console.log(`Generating ${numSlides} slides for deck "${deck.title}" with prompt: "${prompt}" and theme: "${slideTheme}"`);

    // Generate slides using Gemini API
    const slidesData = await generateSlidesUsingGemini(deck.title, prompt, numSlides, slideTheme, slideTransition);
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
        theme: slideTheme, // Use the normalized theme
        layout,
        order: index,
        deck: deckId,
        transition: slideTransition // Add transition property
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
async function generateSlidesUsingGemini(title, prompt, numSlides, theme, transition) {
  try {
    // Validate and normalize the theme
    if (!theme || typeof theme !== 'string') {
      console.log(`Theme missing or invalid type: ${theme}, defaulting to 'light'`);
      theme = 'light';
    } else {
      theme = theme.toLowerCase().trim();
      if (!['light', 'dark'].includes(theme)) {
        console.log(`Invalid theme value: "${theme}", defaulting to 'light'`);
        theme = 'light';
      }
    }
    
    // Validate the transition
    if (!transition) transition = 'fade';
    
    console.log(`Using theme: "${theme}" for slide generation`);
    console.log(`Using transition: "${transition}" for slides`);
    
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
The theme is "${theme}".

Each slide should have:
1. A clear, concise title
2. Properly formatted content with HTML styling
3. Relevant, SPECIFIC information that's factually accurate
4. Professional tone and language
5. DO NOT INCLUDE IMAGES - our backend will add them automatically
6. Additional content that provides depth and detail

CRITICAL INSTRUCTIONS:
- NEVER use generic placeholders like "Additional feature or benefit", "Supporting information or data", "Important Information", etc.
- ALL content MUST be specific to the topic (${prompt})
- Each slide should contain actual information, facts, or descriptions related to ${prompt}
- DO NOT INCLUDE ANY IMAGE HTML TAGS OR REFERENCES - the backend system will add proper images
- Even if you don't know specific details, make reasonable, plausible content rather than generic placeholders
- For conclusion slides, include specific summary points about ${prompt}, not vague statements

The slides should include:
- Content slides with SPECIFIC key information (no images - we will add them)
- A conclusion/summary slide (last slide) with SPECIFIC information related to the topic (no images - we will add them)

Use proper HTML formatting with inline CSS styling for a professional appearance.
Wrap each slide's content in a div with padding, styling, and transitions.
Include these transition effects based on the selected transition type: "${transition}"

Use these transition CSS classes:
- fade: "transition-opacity duration-500 ease-in-out"
- slide: "transition-transform duration-500 ease-in-out"
- zoom: "transition-transform duration-500 ease-in-out transform hover:scale-105"
- flip: "transition-transform duration-500 perspective-1000 hover:rotate-y-180"
- cube: "transition-transform duration-700 transform-style-3d rotate-y-0 hover:rotate-y-90"

Use these style guidelines based on the selected theme:

${theme === 'dark' ? 
  `DARK THEME:
  - Background: #1e293b (dark blue-gray)
  - Font colors: #f8fafc (very light gray) for all text
  - Headings: #60a5fa (light blue) for titles and headings
  - Text: #e2e8f0 (light gray) for body text
  - Accents: #818cf8 (indigo) for highlights and bullet points` 
:
  `LIGHT THEME:
  - Background: #f8fafc (very light gray)
  - Font colors: #334155 (slate) for body text, #1e40af (dark blue) for headings
  - Layout: Center titles, left-align content with proper spacing
  - Padding: 60px padding on all sides`
}

IMPORTANT: Your response MUST include EXACTLY ${numSlides} slides, no more and no less.
IMPORTANT: Every bullet point must contain actual content specific to ${prompt}.
IMPORTANT: DO NOT include any <img> tags or image URLs. The system will add images separately.
IMPORTANT: Never, under any circumstances, use placeholders like "Highlighted benefit or feature" or "Important conclusion point".
IMPORTANT: If you cannot generate exactly ${numSlides} slides with specific content, it is better to repeat information than to use generic placeholders.

Example slide content format:
{
  "title": "Specific Title About ${prompt}",
  "content": "<div class='${transition === 'fade' ? 'transition-opacity duration-500 ease-in-out' : transition === 'slide' ? 'transition-transform duration-500 ease-in-out' : transition === 'zoom' ? 'transition-transform duration-500 ease-in-out transform hover:scale-105' : transition === 'flip' ? 'transition-transform duration-500 perspective-1000 hover:rotate-y-180' : 'transition-opacity duration-500 ease-in-out'}' style='display: flex; flex-direction: column; justify-content: flex-start; width: 100%; height: 100%; padding: 60px; background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'}; font-family: Arial, sans-serif;'><h2 style='font-size: 36px; margin-bottom: 30px; color: ${theme === 'dark' ? '#60a5fa' : '#1e40af'}; text-align: center;'>Specific Heading About ${prompt}</h2><div style='margin-bottom: 30px;'><p style='font-size: 24px; margin-bottom: 25px; color: ${theme === 'dark' ? '#e2e8f0' : '#334155'};'>Specific description about an aspect of ${prompt}</p><ul style='font-size: 20px; margin-left: 30px; color: ${theme === 'dark' ? '#e2e8f0' : '#334155'};'><li style='margin-bottom: 15px;'>Specific fact about ${prompt}</li><li style='margin-bottom: 15px;'>Specific detail about ${prompt}</li></ul></div></div>"
}

Your response should be a valid JSON array of exactly ${numSlides} slide objects.`;

    const userPrompt = `Create EXACTLY ${numSlides} detailed slides about "${prompt}" with the title "${title}" using a ${theme} theme. Include specific details and transitions for all slides. DO NOT include images - our system will add them separately.`;
    
    // Prepare the request body
    const requestBody = {
      contents: [{
        parts: [
          { text: systemPrompt + "\n\n" + userPrompt }
        ]
      }]
    };
    
    // Log a sample of what we're sending to Gemini API
    console.log(`Sending request to Gemini API with theme: "${theme}"`);
    console.log(`Sample template reference in prompt: background-color: ${theme === 'dark' ? '#1e293b' : '#f8fafc'}`);
    
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
                    responseText.match(/\[\s*\{\s*"title"[\s\S]*?\}\s*\]/);
    
    let jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    
    // Clean up the JSON string
    jsonContent = jsonContent.replace(/```json|```/g, '').trim();
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonContent);
      let slides = await processSlides(parsedResponse, numSlides, theme, transition, prompt);
      return slides;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      console.error("Attempted to parse:", jsonContent);
      
      // Try to find an array in the response
      const arrayMatch = responseText.match(/\[\s*{[\s\S]*?}\s*\]/);
      if (arrayMatch) {
        try {
          parsedResponse = JSON.parse(arrayMatch[0]);
          let slides = await processSlides(parsedResponse, numSlides, theme, transition, prompt);
          return slides;
        } catch (arrayError) {
          console.error("Array parse error:", arrayError);
          throw new Error("Failed to parse AI response as JSON");
        }
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }
  } catch (error) {
    console.error("Error using Gemini API:", error);
    throw error;
  }
}

// Process slides to ensure they have all necessary elements
async function processSlides(parsedResponse, numSlides, theme, transition, prompt) {
  let slides = [];
  
  // Extract slides from the response
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
  
  // Handle case where no valid slides were extracted
  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    throw new Error('No valid slides found in response');
  }
  
  // If we have too many slides, trim to the exact number requested
  if (slides.length > numSlides) {
    slides = slides.slice(0, numSlides);
  }
  
  // If we don't have enough slides, duplicate the last slide
  while (slides.length < numSlides) {
    const lastSlide = {...slides[slides.length - 1]};
    lastSlide.title = `More About ${prompt} (${slides.length + 1})`;
    slides.push(lastSlide);
  }

  // Track used image URLs to avoid repetition
  const usedImageUrls = [];

  // Process each slide to add transitions and images
  const processedSlides = await Promise.all(slides.map(async (slide, index) => {
    // Make a copy of the slide to work with
    const processedSlide = {...slide};
    
    // Clean existing content of any broken image tags
    if (processedSlide.content) {
      // Remove any existing image tags (we'll add our own)
      processedSlide.content = processedSlide.content.replace(/<img[^>]*>/g, '');
      
      // Remove placeholder references
      processedSlide.content = processedSlide.content.replace(/placehold\.co/g, '');
      processedSlide.content = processedSlide.content.replace(/\[TOPIC\]/g, '');
      processedSlide.content = processedSlide.content.replace(/\[KEYWORDS\]/g, '');
    }
    
    // Add transition class if missing
    if (!processedSlide.content.includes('transition-')) {
      const transitionClass = getTransitionClass(transition);
      processedSlide.content = processedSlide.content.replace('<div', `<div class="${transitionClass}"`);
    }
    
    // Determine if this is a one-column or two-column layout
    let isOneColumnLayout = true;
    if (processedSlide.content.includes('display: flex') && 
        processedSlide.content.includes('justify-content: space-between')) {
      isOneColumnLayout = false;
    }
    
    // Get image URL using Unsplash API, passing the list of already used URLs
    const imageUrl = await fetchImageForSlide(
      processedSlide.content, 
      processedSlide.title, 
      prompt,
      usedImageUrls
    );
    
    // Add this URL to our tracking list to avoid reuse
    if (imageUrl) {
      usedImageUrls.push(imageUrl);
    }
    
    // For one-column layout, add the image at the end
    if (isOneColumnLayout) {
      // Find the closing div and add an image before it
      const closingTagIndex = processedSlide.content.lastIndexOf('</div>');
      if (closingTagIndex !== -1) {
        processedSlide.content = 
          processedSlide.content.substring(0, closingTagIndex) +
          `<div style="display: flex; justify-content: center; margin-top: 30px;">
            <img src="${imageUrl}" 
                 alt="${processedSlide.title}" 
                 style="max-width: 90%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          </div>` +
          processedSlide.content.substring(closingTagIndex);
      }
    } else {
      // For two-column layout, look for the image container div and add the image there
      const imgContainerRegex = /<div[^>]*flex:\s*1[^>]*>(?![\s\S]*?<img)/i;
      const match = processedSlide.content.match(imgContainerRegex);
      
      if (match && match.index) {
        const insertPoint = match.index + match[0].length;
        processedSlide.content = 
          processedSlide.content.substring(0, insertPoint) +
          `<img src="${imageUrl}" 
               alt="${processedSlide.title}" 
               style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">` +
          processedSlide.content.substring(insertPoint);
      } else {
        // If we couldn't find a place to insert, add it at the end before the last div
        const closingTagIndex = processedSlide.content.lastIndexOf('</div>');
        if (closingTagIndex !== -1) {
          processedSlide.content = 
            processedSlide.content.substring(0, closingTagIndex) +
            `<div style="display: flex; justify-content: center; margin-top: 30px;">
              <img src="${imageUrl}" 
                   alt="${processedSlide.title}" 
                   style="max-width: 90%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            </div>` +
            processedSlide.content.substring(closingTagIndex);
        }
      }
    }
    
    return processedSlide;
  }));
  
  return processedSlides;
}

// Helper function to get the transition class
function getTransitionClass(transition) {
  switch (transition) {
    case 'fade':
      return 'transition-opacity duration-500 ease-in-out';
    case 'slide':
      return 'transition-transform duration-500 ease-in-out';
    case 'zoom':
      return 'transition-transform duration-500 ease-in-out transform hover:scale-105';
    case 'flip':
      return 'transition-transform duration-500 perspective-1000 hover:rotate-y-180';
    case 'cube':
      return 'transition-transform duration-700 transform-style-3d rotate-y-0 hover:rotate-y-90';
    default:
      return 'transition-opacity duration-500 ease-in-out';
  }
}

// Fetch image for a slide using Unsplash API with improved reliability
async function fetchImageForSlide(slideContent, slideTitle, promptTopic, usedUrls = []) {
  try {
    // Extract keywords for the search query
    const keywords = extractKeywords(slideContent, slideTitle, promptTopic);
    const category = determineCategory(promptTopic, keywords);
    
    // Create search query by combining keywords
    const searchQuery = keywords.join(' ');
    
    console.log(`Fetching image for slide "${slideTitle}" with query: "${searchQuery}"`);
    
    // Check if API key is available
    if (!UNSPLASH_ACCESS_KEY) {
      console.log('Unsplash API key not found, using fallback from category:', category);
      return getRandomUnusedImage(category, usedUrls);
    }
    
    // Call the Unsplash API with authentication - increased results per page for variety
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=10`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      console.log(`Unsplash API error: ${response.status} - ${response.statusText}`);
      return getRandomUnusedImage(category, usedUrls);
    }
    
    const data = await response.json();
    
    // If we got results, use one of the images that hasn't been used before
    if (data.results && data.results.length > 0) {
      // Filter out any previously used URLs
      const unusedResults = data.results.filter(result => !usedUrls.includes(result.urls.regular));
      
      if (unusedResults.length > 0) {
        // Choose a random image from the unused results
        const randomIndex = Math.floor(Math.random() * unusedResults.length);
        return unusedResults[randomIndex].urls.regular;
      } else if (data.results.length > 0) {
        // If all images have been used before, pick a random one anyway
        const randomIndex = Math.floor(Math.random() * data.results.length);
        return data.results[randomIndex].urls.regular;
      }
    }
    
    // If no results or all have been used, try a more general query with just the topic
    if (promptTopic) {
      console.log(`No unused results found, trying more general search with topic: "${promptTopic}"`);
      
      const backupResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(promptTopic)}&per_page=10`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );
      
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        if (backupData.results && backupData.results.length > 0) {
          // Filter out previously used URLs
          const unusedBackupResults = backupData.results.filter(result => !usedUrls.includes(result.urls.regular));
          
          if (unusedBackupResults.length > 0) {
            // Choose a random unused image
            const randomIndex = Math.floor(Math.random() * unusedBackupResults.length);
            return unusedBackupResults[randomIndex].urls.regular;
          } else if (backupData.results.length > 0) {
            // If all have been used, pick a random one
            const randomIndex = Math.floor(Math.random() * backupData.results.length);
            return backupData.results[randomIndex].urls.regular;
          }
        }
      }
    }
    
    // Fallback to category-based image
    console.log(`Using fallback image for category: ${category}`);
    return getRandomUnusedImage(category, usedUrls);
  } catch (error) {
    console.error('Error fetching image:', error);
    // Determine a fallback category and use a guaranteed working image
    const keywords = extractKeywords('', slideTitle, promptTopic);
    const category = determineCategory(promptTopic, keywords);
    return getRandomUnusedImage(category, usedUrls);
  }
}

// Helper function to get a random unused image from a category
function getRandomUnusedImage(category, usedUrls) {
  // Use a randomized fallback category if the main one is unavailable
  const fallbackOptions = {
    business: [
      'https://images.unsplash.com/photo-1664575599736-c5197c684172?w=800',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800',
      'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800'
    ],
    technology: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800'
    ],
    nature: [
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
    ],
    food: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800',
      'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=800'
    ],
    travel: [
      'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
      'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800',
      'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=800',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800'
    ],
    sports: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
      'https://images.unsplash.com/photo-1517649281203-dad836b4b028?w=800'
    ],
    education: [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800'
    ],
    health: [
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
    ],
    science: [
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800',
      'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=800',
      'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800',
      'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800'
    ],
    art: [
      'https://images.unsplash.com/photo-1579783483458-83d02161294e?w=800',
      'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800',
      'https://images.unsplash.com/photo-1548081087-11c73fc3ce86?w=800',
      'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=800'
    ],
    music: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      'https://images.unsplash.com/photo-1458560871784-56d23406c091?w=800'
    ],
    finance: [
      'https://images.unsplash.com/photo-1565514501303-256e0ea65d49?w=800',
      'https://images.unsplash.com/photo-1611174743c4-3c7d8e80e44c?w=800',
      'https://images.unsplash.com/photo-1638913975386-d61f0ec6500d?w=800',
      'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800',
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=800',
      'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800',
      'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800',
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800'
    ]
  };
  
  // If we have specific options for this category, use them
  const categoryOptions = fallbackOptions[category] || fallbackOptions.default;
  
  // Filter out used URLs
  const unusedOptions = categoryOptions.filter(url => !usedUrls.includes(url));
  if (unusedOptions.length > 0) {
    // Return a random unused option
    return unusedOptions[Math.floor(Math.random() * unusedOptions.length)];
  }
  
  // If all options for this category are used, try the main FALLBACK_IMAGES
  const mainImage = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;
  if (!usedUrls.includes(mainImage)) {
    return mainImage;
  }
  
  // If even the main image is used, pick a random category's image
  const allCategories = Object.keys(FALLBACK_IMAGES);
  
  // Filter out categories we've already tried
  const unusedCategories = allCategories.filter(cat => 
    cat !== category && FALLBACK_IMAGES[cat] && !usedUrls.includes(FALLBACK_IMAGES[cat])
  );
  
  if (unusedCategories.length > 0) {
    // Choose a random unused category
    const randomCategory = unusedCategories[Math.floor(Math.random() * unusedCategories.length)];
    return FALLBACK_IMAGES[randomCategory];
  }
  
  // Last resort: return a completely random image from any category's options
  const allOptions = Object.values(fallbackOptions).flat();
  return allOptions[Math.floor(Math.random() * allOptions.length)];
}

// Extract meaningful keywords from slide content and title
function extractKeywords(slideContent, slideTitle, promptTopic) {
  // Start with the prompt topic as the base
  let keywords = promptTopic ? [promptTopic] : [];
  
  // Add the slide title as it's usually most relevant
  if (slideTitle) {
    // Clean and extract words from title
    const titleWords = slideTitle
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'from', 'about', 'with', 'have', 'there', 'their', 'what', 'when', 'where', 'which', 'while', 'would', 'could', 'should'].includes(word));
      
    // Add unique words from title
    titleWords.forEach(word => {
      if (!keywords.includes(word)) {
        keywords.push(word);
      }
    });
  }
  
  // Extract content text (removing HTML tags)
  if (slideContent) {
    const contentText = slideContent
      .replace(/<[^>]*>/g, ' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['this', 'that', 'from', 'about', 'with', 'have', 'there', 'their', 'what', 'when', 'where', 'which', 'while', 'would', 'could', 'should'].includes(word));
    
    // Add top 3 longest words from content (they're often most specific)
    contentText
      .sort((a, b) => b.length - a.length)
      .slice(0, 3)
      .forEach(word => {
        if (!keywords.includes(word)) {
          keywords.push(word);
        }
      });
  }
  
  // Limit to 5 keywords max and ensure we have at least one
  keywords = keywords.slice(0, 5);
  if (keywords.length === 0) {
    keywords.push('presentation');
  }
  
  return keywords;
}

// Determine content category for fallback images
function determineCategory(promptTopic, keywords) {
  const combinedText = [promptTopic, ...keywords].join(' ').toLowerCase();
  
  // Check for category matches
  if (/business|company|corporate|finance|economy|market|stock|office|professional|work/i.test(combinedText)) {
    return 'business';
  }
  if (/tech|technology|computer|digital|software|hardware|program|code|internet|web|app|ai|robot/i.test(combinedText)) {
    return 'technology';
  }
  if (/nature|environment|eco|green|plant|animal|wildlife|forest|mountain|ocean|sea|beach|sky|landscape/i.test(combinedText)) {
    return 'nature';
  }
  if (/food|eat|cuisine|dish|meal|restaurant|cook|chef|kitchen|recipe|ingredient|fruit|vegetable/i.test(combinedText)) {
    return 'food';
  }
  if (/travel|tourism|vacation|holiday|trip|journey|adventure|destination|tour|city|country|world|explore/i.test(combinedText)) {
    return 'travel';
  }
  if (/sport|game|athlete|team|play|competition|tournament|championship|football|soccer|basketball|tennis|golf/i.test(combinedText)) {
    return 'sports';
  }
  if (/education|learn|school|university|college|student|teacher|professor|academic|study|research|knowledge/i.test(combinedText)) {
    return 'education';
  }
  if (/health|medical|doctor|hospital|wellness|fitness|exercise|yoga|meditation|mind|body|nutrition|diet/i.test(combinedText)) {
    return 'health';
  }
  if (/science|scientific|physics|chemistry|biology|experiment|lab|theory|hypothesis|quantum|molecule|atom/i.test(combinedText)) {
    return 'science';
  }
  if (/art|artistic|paint|drawing|sculpture|creative|museum|gallery|exhibition|design|visual|aesthetic/i.test(combinedText)) {
    return 'art';
  }
  if (/music|song|band|concert|instrument|guitar|piano|drum|rhythm|melody|symphony|orchestra/i.test(combinedText)) {
    return 'music';
  }
  if (/finance|money|banking|investment|fund|budget|saving|loan|credit|debt|trading|stock/i.test(combinedText)) {
    return 'finance';
  }
  if (/history|historical|ancient|century|civilization|empire|king|queen|war|period|era|past/i.test(combinedText)) {
    return 'history';
  }
  if (/fashion|style|clothing|dress|wear|trend|designer|model|outfit|accessory|textile|collection/i.test(combinedText)) {
    return 'fashion';
  }
  if (/architecture|building|structure|design|construction|architect|skyscraper|house|bridge|tower/i.test(combinedText)) {
    return 'architecture';
  }
  if (/car|automobile|vehicle|driving|race|engine|wheel|speed|motor|automotive|truck|sedan/i.test(combinedText)) {
    return 'cars';
  }
  if (/space|universe|galaxy|planet|star|astronomy|cosmos|solar|lunar|moon|mars|astronaut|nasa/i.test(combinedText)) {
    return 'space';
  }
  if (/animal|wildlife|species|pet|dog|cat|bird|fish|mammal|reptile|zoo|ecosystem/i.test(combinedText)) {
    return 'animals';
  }
  if (/game|gaming|player|console|video|playstation|xbox|nintendo|esport|minecraft|fortnite/i.test(combinedText)) {
    return 'gaming';
  }
  if (/politics|government|policy|election|president|democracy|party|vote|senator|law|congress/i.test(combinedText)) {
    return 'politics';
  }
  if (/religion|faith|spiritual|church|temple|mosque|prayer|god|belief|worship|religious|sacred/i.test(combinedText)) {
    return 'religion';
  }
  if (/entertainment|movie|film|cinema|theater|show|celebrity|actor|actress|hollywood|tv|television/i.test(combinedText)) {
    return 'entertainment';
  }
  if (/military|army|navy|air force|soldier|war|weapon|defense|strategy|combat|security|tactical/i.test(combinedText)) {
    return 'military';
  }
  if (/innovation|innovative|idea|invention|creative|solution|progress|startup|entrepreneur|future/i.test(combinedText)) {
    return 'innovation';
  }
  if (/motivation|inspire|success|goal|achieve|dream|mindset|positive|courage|determination/i.test(combinedText)) {
    return 'motivation';
  }
  if (/leadership|leader|manage|team|organization|vision|influence|guide|direct|executive|ceo/i.test(combinedText)) {
    return 'leadership';
  }
  if (/climate|weather|change|global warming|environment|sustainable|carbon|emission|temperature/i.test(combinedText)) {
    return 'climate';
  }
  if (/development|progress|grow|improve|evolve|advance|expansion|growth|upgrade|enhancement/i.test(combinedText)) {
    return 'development';
  }
  if (/communication|speak|talk|message|conversation|present|discuss|speech|dialogue|interact/i.test(combinedText)) {
    return 'communication';
  }
  
  return 'default';
}

module.exports = router; 