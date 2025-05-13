'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getToken } from './lib/api';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  return (
    <div className="flex flex-col min-h-screen pt-16">
      {/* Decorative background elements */}
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-40 left-40 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Hero Section */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative animate-fade-in">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-3 py-1 bg-blue-100 bg-opacity-80 rounded-full text-blue-700 text-sm font-medium animate-slide-up">
            AI-Powered Presentation Creator
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight animate-slide-up">
            Create Beautiful <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Presentations </span>
            with AI
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto animate-slide-up">
            Generate professional slides in minutes using our AI-powered platform.
            Perfect for business, academic, and creative presentations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="/create"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Create Presentation</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            {!loading && !isAuthenticated && (
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              SlideGen offers everything you need to create stunning presentations without the hassle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 card">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Generation
              </h3>
              <p className="text-gray-600 mb-4">
                Let our AI create professional content for your slides based on your topic. Generates complete presentations in seconds.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Topic analysis
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Content structuring
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Professional formatting
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 card">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Rich Text Editor
              </h3>
              <p className="text-gray-600 mb-4">
                Edit and customize your slides with our intuitive editor. Complete control over your content and layout.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Text formatting tools
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Image insertion
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Multiple themes
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 card">
              <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-6 text-indigo-600">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Export & Share
              </h3>
              <p className="text-gray-600 mb-4">
                Export your presentations to PDF or download them for offline use. Share with colleagues easily.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  PDF export
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Private storage
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Share functionality
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create stunning presentations?</h2>
          <p className="text-xl mb-10 text-blue-100">Join thousands of professionals creating beautiful slides in minutes.</p>
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg inline-block"
          >
            Get Started For Free
          </Link>
        </div>
      </section>
    </div>
  );
}
