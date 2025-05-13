# Unsplash Integration Guide

This document explains how the Unsplash API is integrated into the slide generator application to automatically add relevant, high-quality images to presentations.

## How It Works

The slide generator uses Unsplash's API to find and incorporate relevant images for each slide based on the slide's content. The system follows a multi-tiered approach to ensure reliability:

1. **Primary**: Targeted search using keywords extracted from slide content
2. **Secondary**: Topic-based search if specific keywords don't yield results
3. **Fallback**: Category-specific pre-selected images if API calls fail

## Setup Instructions

### 1. Get Unsplash API Keys

1. Create an account at [Unsplash Developers](https://unsplash.com/developers)
2. Register a new application
3. Obtain your Access Key and Secret Key
4. Set appropriate application name and description
5. Accept the API terms and conditions

### 2. Configure Environment Variables

Add your Unsplash API keys to your backend `.env` file:

```
UNSPLASH_ACCESS_KEY=your_access_key_here
UNSPLASH_SECRET_KEY=your_secret_key_here
```

> Note: The Access Key is required for basic functionality. The Secret Key is used for optional download tracking in accordance with Unsplash's API guidelines.

### 3. Test the Integration

1. Start your application
2. Generate a new presentation
3. Check the server logs to confirm successful API calls
4. Verify that images appear in your slides

## Architecture Details

### Keyword Extraction

The system extracts relevant keywords for image searches using:

1. The overall presentation topic
2. Each slide's title (heavily weighted)
3. Key phrases from slide content
4. Longest words from content (often most specific)

Example:
```javascript
// For a slide about "The Benefits of Mediterranean Diet"
// Keywords might be: [mediterranean, diet, benefits, health, nutrition]
```

### Category Detection

The system can detect 21+ topic categories including:

- Business
- Technology
- Nature
- Food
- Travel
- Sports
- Education
- Health
- Science
- Art
- Music
- And many more...

This categorization helps with selecting appropriate fallback images if the API search fails.

### Image Placement

The image placement logic:

1. Detects if a slide has a one-column or two-column layout
2. For one-column: adds image at the bottom
3. For two-column: adds image to the right side
4. Ensures responsive sizing with appropriate CSS

## Optimization Tips

1. **Be Specific**: More specific presentation topics lead to better image matches
2. **Check Rate Limits**: Unsplash has rate limits (50 requests/hour for demo applications)
3. **Caching**: The system doesn't currently cache images; consider implementing caching for high-traffic applications
4. **Attribution**: While not required for the API, consider adding attribution for Unsplash photographers in your presentation footer

## Troubleshooting

### Common Issues

**No Images Appear**
- Check server logs for API errors
- Verify your Access Key is correct
- Ensure you have internet connectivity

**Irrelevant Images**
- Try more specific presentation topics
- The fallback system may have activated

**Rate Limit Errors**
- You've exceeded Unsplash's rate limits
- Wait until the limit resets or create a production application with higher limits

## Image Quality Control

The system ensures high-quality images by:

1. Using Unsplash's curated collection of professional photos
2. Requesting appropriately sized images (not too large or small)
3. Applying consistent styling (rounding, shadows)
4. Ensuring responsive sizing for different devices

## Technical Implementation

The core image functionality is in the `fetchImageForSlide` function in `backend/routes/generate-slides.js`. This function:

1. Extracts keywords from slide content
2. Determines the content category
3. Makes API calls to Unsplash
4. Handles errors and provides fallbacks
5. Returns a reliable image URL

```javascript
async function fetchImageForSlide(slideContent, slideTitle, promptTopic) {
  // Extract keywords and search Unsplash
  // Return appropriate image URL
}
```

## References

- [Unsplash API Documentation](https://unsplash.com/documentation)
- [Unsplash Guidelines](https://help.unsplash.com/en/articles/2511315-guideline-attribution)
- [Rate Limits](https://help.unsplash.com/en/articles/3887947-rate-limiting) 