# Slide Generator Backend

The server component of the AI-powered slide generation application. This backend handles authentication, database operations, and most importantly, the AI-driven slide generation.

## Key Components

### Slide Generation Engine

The core functionality of this application is implemented in `routes/generate-slides.js`, which:

1. **Content Generation**: Integrates with Google's Gemini API to create detailed slide content based on user prompts
2. **Image Selection**: Uses Unsplash API to find and incorporate relevant images for each slide
3. **Visual Styling**: Applies theme-based styling and transitions to create professional presentations

### API Routes

- **Auth Routes**: User registration, login, and token verification
- **Deck Routes**: Create, read, update, and delete presentation decks
- **Slide Routes**: Manage individual slides within decks
- **Generate Routes**: AI-powered slide content generation

## Image System

The image system uses a sophisticated multi-tiered approach:

1. **Primary**: Unsplash API with targeted keyword search
2. **Secondary**: Broader topic-based search if specific keywords fail
3. **Fallback**: Category-specific guaranteed images for reliability

The system intelligently categorizes content into 21+ topics including business, technology, science, art, and more.

## API Integration

### Gemini API Integration

Used for generating slide content with:
- Slide titles and subtitles
- Detailed bullet points
- Factual, relevant information
- Professional formatting

### Unsplash API Integration

Used for image selection with:
- Keyword extraction from slide content
- Category-based matching
- Fallback mechanisms for reliability

## Environment Setup

Required environment variables:
```
MONGODB_URI=mongodb://localhost:27017/slides-app
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
UNSPLASH_SECRET_KEY=your_unsplash_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the variables listed above

3. Start development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user details (requires auth)

### Decks
- `GET /api/decks` - Get all user's decks (requires auth)
- `POST /api/decks` - Create new deck (requires auth)
- `GET /api/decks/:id` - Get specific deck with slides (requires auth)
- `PUT /api/decks/:id` - Update deck (requires auth)
- `DELETE /api/decks/:id` - Delete deck (requires auth)

### Slides
- `GET /api/slides/:id` - Get specific slide (requires auth)
- `PUT /api/slides/:id` - Update slide (requires auth)
- `DELETE /api/slides/:id` - Delete slide (requires auth)

### Slide Generation
- `POST /api/generate-slides` - Generate slides for a deck (requires auth)
  - Body parameters:
    - `deckId`: ID of the deck
    - `prompt`: Topic for slide generation
    - `numSlides`: Number of slides to generate
    - `theme`: "light" or "dark"
    - `transition`: Transition effect name

## Folder Structure

```
backend/
├── models/            # MongoDB schemas
│   ├── User.js        
│   ├── Deck.js        
│   └── Slide.js       
├── routes/            # API endpoints
│   ├── auth.js        
│   ├── decks.js       
│   ├── slides.js      
│   └── generate-slides.js  # Main slide generation logic
├── middleware/        # Express middleware
│   └── auth.js        # JWT authentication
├── server.js          # Express app setup
└── package.json
``` 