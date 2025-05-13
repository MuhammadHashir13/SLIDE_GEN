# AI-Powered Slide Generator

A modern web application that automatically creates beautiful presentation slides using AI. Simply provide a topic, and the system generates a complete presentation with engaging content, carefully selected images, and professional transitions.

## ✨ Features

- **AI-Generated Content**: Utilizes Google's Gemini API to create detailed, topic-specific slide content
- **Smart Image Integration**: Automatically adds relevant images to each slide using Unsplash API
- **Beautiful Transitions**: Choose from multiple transition effects (fade, slide, zoom, flip, cube)
- **Theme Support**: Light and dark themes for different presentation contexts
- **Responsive Design**: Optimized for all devices and screen sizes
- **Secure Authentication**: User account system with JWT authentication
- **Persistent Storage**: Save and manage multiple presentations in your personal dashboard

## 🚀 Technology Stack

### Frontend
- Next.js for the React framework
- Tailwind CSS for styling
- React Context API for state management

### Backend
- Node.js and Express for the server
- MongoDB for database storage
- JWT for authentication
- Google Gemini API for content generation
- Unsplash API for high-quality images

## 📋 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance (local or Atlas)
- API keys for Gemini and Unsplash

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/slide-generator.git
cd slide-generator
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:

**Backend (.env file in backend directory)**
```
# MongoDB connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret

# API Keys
GEMINI_API_KEY=your_gemini_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
UNSPLASH_SECRET_KEY=your_unsplash_secret_key

# Server config
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local file in frontend directory)**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the development servers:

**Backend**
```bash
cd backend
npm run dev
```

**Frontend**
```bash
cd frontend
npm run dev
```

5. Access the application at http://localhost:3000

## 📝 Usage Guide

### Creating a New Presentation

1. Log in to your account
2. Click "Create New Deck" on the dashboard
3. Enter a title for your presentation
4. Provide the main topic or prompt for your slides
5. Select the number of slides you want (3-10 recommended)
6. Choose a theme (light or dark)
7. Select a transition effect
8. Click "Generate Slides"
9. Wait for the AI to create your presentation (typically 10-20 seconds)

### Viewing and Managing Presentations

1. All your presentations appear on your dashboard
2. Click any presentation to view it in presentation mode
3. Use arrow keys to navigate between slides
4. Edit individual slides from the deck view
5. Delete presentations you no longer need

## 🌟 Key Features Explained

### AI Content Generation

The system uses Google's Gemini API to generate factual, relevant content for each slide based on your topic. Each slide includes:
- A concise, informative title
- Detailed bullet points or paragraphs
- Proper formatting and organization

### Image System

The application automatically adds relevant images to each slide using a multi-tiered approach:
1. First attempts to find perfect matches via Unsplash API
2. Falls back to topic-based searches if specific searches fail
3. Uses category-based fallback images for guaranteed reliability

The system supports 21+ categories including business, technology, science, art, and more.

### Transitions

Choose from five professional slide transitions:
- **Fade**: Smooth opacity transition between slides
- **Slide**: Slides move from right to left
- **Zoom**: Subtle zoom effect on slide change
- **Flip**: 3D flip animation between slides
- **Cube**: 3D cube rotation effect

## 🔍 Troubleshooting

### Common Issues

**API Key Problems**
- Ensure your API keys are correctly set in the .env file
- Verify API keys are active and have the necessary permissions

**Image Not Loading**
- Check internet connection
- Verify Unsplash API key is valid
- The system will automatically use fallback images if needed

**Content Generation Issues**
- Ensure Gemini API key is valid
- Try more specific topic descriptions
- Check server logs for detailed error messages

## 📚 API Documentation

The backend exposes several REST endpoints:

- **POST /api/auth/register**: Create a new user account
- **POST /api/auth/login**: Authenticate and receive JWT token
- **GET /api/decks**: Get all decks for current user
- **POST /api/decks**: Create a new deck
- **GET /api/decks/:id**: Get a specific deck with its slides
- **POST /api/generate-slides**: Generate slides for a deck

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Unsplash](https://unsplash.com/) for providing the image API
- [Google Gemini](https://ai.google.dev/) for the content generation API
- [MongoDB](https://www.mongodb.com/) for database services
- All open source packages used in this project
