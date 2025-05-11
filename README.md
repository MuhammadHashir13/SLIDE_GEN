# SlideGen - AI-Powered Slide Generation Platform

A modern web application that helps users create beautiful presentations using AI. Built with Next.js, Node.js, and MongoDB.

## Features

- 🎨 Multiple slide templates and themes
- 🤖 AI-powered content generation
- 📊 Dynamic slide layouts
- 💾 Save and export presentations
- 🎯 User authentication system
- 📱 Responsive design

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- ShadcnUI Components
- React-PDF for export

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Hugging Face API Integration

## Project Structure

```
slidegen/
├── frontend/           # Next.js frontend application
│   ├── app/           # App router pages
│   ├── components/    # React components
│   ├── public/        # Static assets
│   └── styles/        # Global styles
│
├── backend/           # Node.js backend application
│   ├── controllers/   # Route controllers
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   └── config/        # Configuration files
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/slidegen.git
cd slidegen
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd ../backend
npm install
```

4. Set up environment variables
- Create `.env` files in both frontend and backend directories
- Add necessary environment variables (see .env.example files)

5. Start the development servers

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
npm run dev
```

## Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/slidegen
JWT_SECRET=your_jwt_secret
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
