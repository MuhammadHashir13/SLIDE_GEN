'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, getToken, removeToken } from '../lib/api';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
      setUser(null);
        setLoading(false);
      return;
    }
      
      try {
        const userData = await apiFetch('/api/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Auth error:', error);
        // Only remove token if it's an auth error
        if (error.message && error.message.toLowerCase().includes('auth')) {
          removeToken();
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Add scroll effect for glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => pathname === path;

  const handleLogout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white bg-opacity-80 backdrop-blur-md shadow-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 font-bold text-xl"
            >
              <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-md">
                SG
              </span>
              <span className="hidden sm:block">SlideGen</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link
                href="/create"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/create')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                Create Presentation
              </Link>
              <Link
                href="/my-decks"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/my-decks')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                My Presentations
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center">
                <span className="hidden md:block text-gray-700 px-3">Hi, {user.username || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 