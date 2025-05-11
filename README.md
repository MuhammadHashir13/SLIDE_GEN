# Slide Generator

A modern web application for generating, managing, and exporting presentation slides using Next.js and Express.js.

## Features

### Core Features

1. **Slide Generation**

   - AI-powered slide generation using OpenAI's GPT-4
   - Multiple slide types (Business, Academic, Creative)
   - Customizable themes (Modern, Classic, Minimal)
   - Real-time preview of generated slides

2. **Image Management**

   - Upload images for individual slides
   - Support for multiple image formats (PNG, JPG, GIF)
   - Image size limit of 5MB
   - Preview and remove images

3. **Deck Management**

   - Create and save presentation decks
   - View all saved decks
   - Edit existing decks
   - Delete decks
   - Export decks as PDF

4. **User Authentication**
   - User registration and login
   - Protected routes
   - JWT-based authentication
   - User-specific decks

### Technical Features

1. **Frontend**

   - Built with Next.js
   - Modern UI using Tailwind CSS
   - Responsive design
   - Client-side form validation
   - Protected routes
   - Image upload with preview
   - PDF export functionality

2. **Backend**
   - Express.js server
   - MongoDB database
   - JWT authentication
   - File upload handling
   - PDF generation
   - OpenAI API integration

## Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS
- Axios
- JavaScript

### Backend

- Express.js
- MongoDB
- Mongoose
- JWT
- Multer
- PDFKit
- OpenAI API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- OpenAI API key

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd SLIDE_GEN
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:

   ```bash
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory:

   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

## Running the Application

1. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:

   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Project Structure

```
SLIDE_GEN/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Slides

- POST `/api/slides/generate` - Generate slides
- POST `/api/slides/upload-image` - Upload slide image

### Decks

- GET `/api/decks` - Get all decks
- GET `/api/decks/:id` - Get a single deck
- POST `/api/decks` - Create a new deck
- PUT `/api/decks/:id` - Update a deck
- DELETE `/api/decks/:id` - Delete a deck
- GET `/api/decks/:id/export` - Export deck as PDF

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
