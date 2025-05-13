import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';

// Use Poppins for headers and Inter for body text
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap'
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata = {
  title: 'SlideGen - AI-Powered Slide Generation',
  description: 'Create beautiful presentations with AI-powered slide generation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="font-sans bg-gray-50">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-[-1]"></div>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="mt-auto py-6 text-center text-gray-500 text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} SlideGen. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
