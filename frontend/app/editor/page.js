'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getToken, removeToken } from '../lib/api';
import dynamic from 'next/dynamic';

// Dynamically import html2canvas and jsPDF to avoid SSR issues
const html2canvas = dynamic(() => import('html2canvas'), { ssr: false });
const jsPDFModule = dynamic(() => import('jspdf'), { ssr: false });

export default function Editor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deck');
  const [deck, setDeck] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef();
  const editableRef = useRef(null);
  const slidesContainerRef = useRef(null);
  const slideRefs = useRef([]);

  // Track if we have focus in the editor to prevent focus loss during formatting
  const [editorHasFocus, setEditorHasFocus] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (!deckId) {
      router.push('/my-decks');
      return;
    }
    apiFetch(`/api/decks/${deckId}`)
      .then((data) => {
        setDeck(data);
        setSlides(data.slides);
        // Initialize slideRefs with the correct length
        slideRefs.current = data.slides.map(() => React.createRef());
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.toLowerCase().includes('authenticate')) {
          removeToken();
          router.push('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [deckId, router]);

  const handleSlideChange = (index) => {
    // Before changing slide, save any edits
    saveCurrentSlideContent();
    setCurrentSlide(index);
  };

  // Save the current slide content from the editable div
  const saveCurrentSlideContent = () => {
    if (editableRef.current && slides[currentSlide]) {
    const newSlides = [...slides];
      newSlides[currentSlide].content = editableRef.current.innerHTML;
    setSlides(newSlides);
    }
  };

  const handleSave = async () => {
    try {
      // Save any pending edits first
      saveCurrentSlideContent();
      
      await apiFetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        body: JSON.stringify({ slides }),
      });
      
      alert('Saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerate = async () => {
    if (!deck.title || !deck.description) {
      alert('Please provide a title and description for your presentation');
      return;
    }

    setIsGenerating(true);
    try {
      await apiFetch('/api/generate-slides', {
        method: 'POST',
        body: JSON.stringify({
          deckId: deckId,
          prompt: deck.description,
          numSlides: slides.length || 5, // Use the current number of slides or default to 5 if none
          theme: deck.theme || 'light'
        }),
      });
      
      // Refresh the slides
      const updatedDeck = await apiFetch(`/api/decks/${deckId}`);
      setSlides(updatedDeck.slides);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export PDF using browser print functionality (works better with CSS styling)
  const handleExportPDF = async () => {
    try {
      // Save current content first
      saveCurrentSlideContent();
      
      // Show export progress
      setIsExporting(true);
      
      // Set print mode on
      setIsPrinting(true);
      
      // Let the browser render the slides with proper theme styling
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add extra print-specific styles to force background colors
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important;
          }
          
          /* Color-specific overrides for print */
          .dark-theme, .dark-theme .slide-container, .dark-theme .slide-content {
            background-color: #1e293b !important;
            color: #e2e8f0 !important;
          }
          
          .dark-theme h1, .dark-theme h2, .dark-theme h3, .dark-theme h4, .dark-theme h5, .dark-theme h6 {
            color: #60a5fa !important;
          }
          
          /* Force all child elements in dark theme to preserve colors */
          .dark-theme * {
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Use browser's print function
      window.print();
      
      // Cleanup after printing
      setTimeout(() => {
        document.head.removeChild(style);
        setIsPrinting(false);
        setIsExporting(false);
      }, 1000);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error exporting PDF: ' + err.message);
      setIsPrinting(false);
      setIsExporting(false);
    }
  };
  
  // Simplified fallback PDF export using browser print
  const handlePrintPDF = () => {
    // Save current content first
    saveCurrentSlideContent();
    
    // Add extra CSS for print styling
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body { background-color: white; }
        
        /* Style each slide's content based on its theme */
        .print-slide.dark-theme .slide-content {
          background-color: #1e293b !important;
          color: #e2e8f0 !important;
        }
        
        .print-slide.light-theme .slide-content {
          background-color: #f8fafc !important;
          color: #334155 !important;
        }
        
        /* Make sure the slide fills the page */
        .slide-for-print {
          break-after: page;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Hide UI elements */
        .format-buttons, .sidebar, header, footer, nav {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Set printing mode to show all slides
    setIsPrinting(true);
    
    // Wait for the print layout to render
    setTimeout(() => {
      window.print();
      // Restore normal view after print dialog is closed or after timeout
      setTimeout(() => {
        setIsPrinting(false);
        document.head.removeChild(style);
      }, 1000);
    }, 500);
  };

  // Apply formatting to selected text in the editable area
  const formatText = (command, value = null) => {
    // Make sure the editable area is focused
    if (editableRef.current) {
      // Store the current selection
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      
      // Focus the editable area
      editableRef.current.focus();
      
      // If there was no selection or it was outside our editor, place cursor at the end
      if (!range || !editableRef.current.contains(range.commonAncestorContainer)) {
        const newRange = document.createRange();
        newRange.selectNodeContents(editableRef.current);
        newRange.collapse(false); // Collapse to the end
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Special handling for certain commands
      if (command === 'fontSize') {
        document.execCommand('fontSize', false, value);
      } else if (command === 'foreColor') {
        document.execCommand('foreColor', false, value);
      } else if (command === 'fontName') {
        document.execCommand('fontName', false, value);
      } else if (command === 'backColor') {
        document.execCommand('backColor', false, value);
      } else if (command === 'createLink') {
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      } else if (command === 'insertImage') {
        const url = prompt('Enter image URL:', 'https://');
        if (url) {
          document.execCommand('insertImage', false, url);
        }
      } else if (command === 'removeFormat') {
        // More thorough removal of formatting
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
      } else {
        // Use standard execCommand for other commands
        try {
          document.execCommand(command, false, value);
        } catch (error) {
          console.error(`Error applying ${command} format:`, error);
        }
      }
      
      // Save the changes after formatting
      setTimeout(() => {
        saveCurrentSlideContent();
        // Re-focus the editable area
        editableRef.current.focus();
      }, 100);
    }
  };

  // Add keyboard shortcut handling
  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Only process if editor has focus
      if (!editorHasFocus) return;
      
      // Ctrl/Cmd + key combinations
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            formatText('bold');
            break;
          case 'i':
            e.preventDefault();
            formatText('italic');
            break;
          case 'u':
            e.preventDefault();
            formatText('underline');
            break;
          case 'l':
            e.preventDefault();
            formatText('createLink');
            break;
          case 'k':
            e.preventDefault();
            formatText('insertImage');
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case '1':
            e.preventDefault();
            formatText('formatBlock', '<h1>');
            break;
          case '2':
            e.preventDefault();
            formatText('formatBlock', '<h2>');
            break;
          case '0':
            e.preventDefault();
            formatText('formatBlock', '<p>');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [editorHasFocus]);

  // Add a help tooltip for keyboard shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // When the current slide changes, focus the editable content
    if (editableRef.current && !isPrinting) {
      // Give the DOM time to update
      setTimeout(() => {
        editableRef.current.focus();
      }, 0);
    }
  }, [currentSlide, isPrinting]);

  // Update slideRefs when slides change
  useEffect(() => {
    slideRefs.current = slides.map(() => React.createRef());
  }, [slides.length]);

  // Add stylesheet for print mode and themes
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .print-slide {
          page-break-after: always;
          height: 100vh;
          width: 100%;
          display: block;
          box-shadow: none !important;
          border: none !important;
        }
        /* Theme styles for print */
        .dark-theme {
          background-color: #1e293b !important;
          color: #e2e8f0 !important;
        }
        .dark-theme h1, .dark-theme h2, .dark-theme h3 {
          color: #60a5fa !important;
        }
        .dark-theme a {
          color: #818cf8 !important;
        }
        .light-theme {
          background-color: #f8fafc !important;
          color: #334155 !important;
        }
        .light-theme h1, .light-theme h2, .light-theme h3 {
          color: #1e40af !important;
        }
        
        /* Force background colors to print */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        @page {
          margin: 0;
          size: landscape;
        }
      }
      
      /* Theme styles for screen display */
      .dark-theme {
        background-color: #1e293b;
        color: #e2e8f0;
      }
      .dark-theme h1, .dark-theme h2, .dark-theme h3 {
        color: #60a5fa;
      }
      .dark-theme a {
        color: #818cf8;
      }
      .light-theme {
        background-color: #f8fafc;
        color: #334155;
      }
      .light-theme h1, .light-theme h2, .light-theme h3 {
        color: #1e40af;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="flex h-screen pt-16 bg-gray-800">
      {/* Hide sidebar when printing */}
      {!isPrinting && (
        <div className="w-64 bg-gray-900 p-4 overflow-y-auto text-white shadow-xl">
          <h2 className="text-xl font-bold mb-6 text-blue-400 flex items-center">
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                <path d="M3 8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </span>
            {deck.title}
          </h2>
          <div className="space-y-2 mb-6">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-full p-3 text-left rounded-md flex items-center transition-all ${
                  currentSlide === index 
                    ? 'bg-blue-600 text-white shadow-md transform translate-x-1' 
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                }`}
              >
                <span className="mr-2 text-xs font-semibold bg-opacity-80 rounded-full w-5 h-5 flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="truncate">Slide {index + 1}</span>
              </button>
            ))}
          </div>
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save Changes
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-600 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-500 flex items-center justify-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className={`${isPrinting ? 'w-full' : 'flex-1'} p-8 overflow-y-auto bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center`}>
        <div ref={slidesContainerRef} className="presentation-frame" style={{ width: '90%', maxWidth: '1200px' }}>
          {/* Slide Navigation Controls - Hide when printing */}
          {!isPrinting && (
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => currentSlide > 0 && handleSlideChange(currentSlide - 1)}
                disabled={currentSlide === 0}
                className="bg-gray-800 text-white p-2 rounded-full disabled:opacity-50 hover:bg-gray-700 transition-colors shadow-md flex items-center"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1">Prev</span>
              </button>
              <div className="text-white bg-gray-800 bg-opacity-80 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm shadow-md">
                Slide {currentSlide + 1} of {slides.length}
              </div>
              <button 
                onClick={() => currentSlide < slides.length - 1 && handleSlideChange(currentSlide + 1)}
                disabled={currentSlide === slides.length - 1}
                className="bg-gray-800 text-white p-2 rounded-full disabled:opacity-50 hover:bg-gray-700 transition-colors shadow-md flex items-center"
                aria-label="Next slide"
              >
                <span className="mr-1">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Slide Content - Either current slide or all slides for printing */}
          {isPrinting ? (
            // All slides for PDF export
            <div className="print-all-slides">
              {slides.map((slide, index) => {
                const slideTheme = slide.theme || deck.theme || 'light';
                const themeClass = slideTheme === 'dark' ? 'dark-theme' : 'light-theme';
                const bgColor = slideTheme === 'dark' ? '#1e293b' : '#f8fafc';
                const textColor = slideTheme === 'dark' ? '#e2e8f0' : '#334155';
                const headingColor = slideTheme === 'dark' ? '#60a5fa' : '#1e40af';
                
                // Apply inline styles directly to ensure they persist in print
                let content = slide.content || '';
                
                // For dark theme, make sure colors are enforced inline
                if (slideTheme === 'dark' && !content.includes('style="background-color: #1e293b')) {
                  if (content.includes('<div')) {
                    // Add background color to main div
                    content = content.replace(/<div/, `<div style="background-color: #1e293b !important; color: #e2e8f0 !important;" `);
                    
                    // Style headings and paragraphs
                    content = content
                      .replace(/<h1/g, `<h1 style="color: ${headingColor} !important;" `)
                      .replace(/<h2/g, `<h2 style="color: ${headingColor} !important;" `)
                      .replace(/<h3/g, `<h3 style="color: ${headingColor} !important;" `);
                  } else {
                    // Wrap content in a styled div if no div exists
                    content = `<div style="background-color: #1e293b !important; color: #e2e8f0 !important; width: 100%; height: 100%; padding: 30px;">${content}</div>`;
                  }
                }
                
                return (
                  <div key={index} className={`slide-for-print mb-10 ${themeClass}`}
                    style={{
                      marginBottom: '50px',
                      breakAfter: 'page'
                    }}
                  >
                    <div 
                      className={`print-slide ${themeClass}`}
                      style={{ 
                        aspectRatio: '16/9',
                        backgroundColor: bgColor,
                        color: textColor,
                        width: '100%',
                        height: 'calc(100vh - 100px)',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div
                        className={`slide-container ${themeClass}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: bgColor,
                          color: textColor
                        }}
                      >
                        <div 
                          dangerouslySetInnerHTML={{ __html: content }}
                          className={`slide-content ${themeClass}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            backgroundColor: bgColor,
                            color: textColor
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Single editable slide
            <div className="slide-frame">
              <div 
                ref={pdfRef} 
                className={`bg-white rounded-lg shadow-2xl overflow-hidden ${slides[currentSlide]?.theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
                style={{ 
                  aspectRatio: '16/9',
                  border: '1px solid #2d3748',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div
                  className="slide-container"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    backgroundColor: slides[currentSlide]?.theme === 'dark' ? '#1e293b' : '#f8fafc'
                  }}
                >
                  <div 
                    ref={editableRef}
                    contentEditable={true}
                    dangerouslySetInnerHTML={{ __html: slides[currentSlide]?.content || '' }}
                    className="slide-content editable-slide"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0, 
                      bottom: 0,
                      overflow: 'auto',
                      outline: 'none',
                      padding: '10px',
                      backgroundColor: slides[currentSlide]?.theme === 'dark' ? '#1e293b' : '#f8fafc',
                      color: slides[currentSlide]?.theme === 'dark' ? '#e2e8f0' : '#334155'
                    }}
                    onFocus={() => setEditorHasFocus(true)}
                    onBlur={(e) => {
                      // Only set focus to false if we're not clicking on a formatting button
                      if (!e.relatedTarget || !e.relatedTarget.closest('.format-buttons')) {
                        setEditorHasFocus(false);
                        saveCurrentSlideContent();
                      }
                    }}
                    onInput={saveCurrentSlideContent}
                    onKeyDown={(e) => {
                      // Save on Enter or key combinations
                      if (e.key === 'Enter' || (e.ctrlKey && e.key === 's')) {
                        setTimeout(saveCurrentSlideContent, 0);
                        if (e.ctrlKey && e.key === 's') {
                          e.preventDefault();
                          handleSave();
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formatting toolbar - hide when printing */}
          {!isPrinting && (
            <div className="mt-6 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl p-4 flex flex-wrap gap-3 justify-center format-buttons shadow-lg border border-gray-700">
              <div className="flex gap-2 mb-2 w-full justify-center">
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('bold')}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('italic')}
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('underline')}
                  title="Underline"
                >
                  <u>U</u>
                </button>
                <select 
                  className="bg-gray-700 text-white rounded px-2"
                  onChange={(e) => formatText('formatBlock', e.target.value)}
                  title="Heading"
                  defaultValue=""
                >
                  <option value="" disabled>Format</option>
                  <option value="<p>">Paragraph</option>
                  <option value="<h1>">Heading 1</option>
                  <option value="<h2>">Heading 2</option>
                  <option value="<h3>">Heading 3</option>
                </select>
                <select 
                  className="bg-gray-700 text-white rounded px-2"
                  onChange={(e) => formatText('fontSize', e.target.value)}
                  title="Font Size"
                  defaultValue=""
                >
                  <option value="" disabled>Size</option>
                  <option value="1">Small</option>
                  <option value="3">Normal</option>
                  <option value="5">Large</option>
                  <option value="7">Huge</option>
                </select>
              </div>
              
              <div className="flex gap-2 mb-2 w-full justify-center">
                <select 
                  className="bg-gray-700 text-white rounded px-2"
                  onChange={(e) => formatText('fontName', e.target.value)}
                  title="Font"
                  defaultValue=""
                >
                  <option value="" disabled>Font</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('insertUnorderedList')}
                  title="Bullet List"
                >
                  • List
                </button>
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('insertOrderedList')}
                  title="Numbered List"
                >
                  1. List
                </button>
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('createLink')}
                  title="Insert Link"
                >
                  🔗 Link
                </button>
                <button 
                  className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                  onClick={() => formatText('insertImage')}
                  title="Insert Image"
                >
                  🖼️ Image
                </button>
              </div>
              
              <div className="flex gap-2 w-full justify-center">
                <div className="flex gap-1">
                  <button 
                    className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                    onClick={() => formatText('justifyLeft')}
                    title="Left Align"
                  >
                    ⬅️
                  </button>
                  <button 
                    className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                    onClick={() => formatText('justifyCenter')}
                    title="Center"
                  >
                    ⬆️
                  </button>
                  <button 
                    className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                    onClick={() => formatText('justifyRight')}
                    title="Right Align"
                  >
                    ➡️
                  </button>
                </div>

                <div className="flex gap-1">
                  <input 
                    type="color" 
                    className="w-8 h-8 rounded cursor-pointer"
                    onChange={(e) => formatText('foreColor', e.target.value)}
                    title="Text Color"
                  />
                  <input 
                    type="color" 
                    defaultValue="#ffffff"
                    className="w-8 h-8 rounded cursor-pointer"
                    onChange={(e) => formatText('backColor', e.target.value)}
                    title="Background Color"
                  />
                </div>
                
                <button 
                  className="text-white bg-red-700 px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => formatText('removeFormat')}
                  title="Clear Formatting"
                >
                  Clear Format
                </button>
              </div>

              {/* Help button to show keyboard shortcuts - positioned in top right */}
              <button 
                className="absolute right-2 top-2 text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 text-sm"
                onClick={() => setShowShortcuts(!showShortcuts)}
                title="Keyboard Shortcuts"
              >
                ⌨️
              </button>

              {showShortcuts && (
                <div className="absolute bg-gray-900 text-white p-4 rounded shadow-lg z-10 right-0 top-[-280px] max-w-xs border border-gray-700">
                  <h3 className="font-bold mb-2 border-b pb-1">Keyboard Shortcuts</h3>
                  <ul className="text-sm">
                    <li className="mb-1"><strong>Ctrl+B</strong>: Bold</li>
                    <li className="mb-1"><strong>Ctrl+I</strong>: Italic</li>
                    <li className="mb-1"><strong>Ctrl+U</strong>: Underline</li>
                    <li className="mb-1"><strong>Ctrl+L</strong>: Insert Link</li>
                    <li className="mb-1"><strong>Ctrl+K</strong>: Insert Image</li>
                    <li className="mb-1"><strong>Ctrl+1</strong>: Heading 1</li>
                    <li className="mb-1"><strong>Ctrl+2</strong>: Heading 2</li>
                    <li className="mb-1"><strong>Ctrl+0</strong>: Paragraph</li>
                    <li className="mb-1"><strong>Ctrl+S</strong>: Save</li>
                  </ul>
                  <button 
                    className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs w-full"
                    onClick={() => setShowShortcuts(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 