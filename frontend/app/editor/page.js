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
          numSlides: 5, // Default to 5 slides or customize as needed
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

  // Export PDF using jsPDF and html2canvas
  const handleExportPDF = async () => {
    try {
      // Save current content first
      saveCurrentSlideContent();
      
      // Show export progress
      setIsExporting(true);
      
      // First, create a temporary rendering of all slides
      setIsPrinting(true);
      
      // Wait for the slides to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all slide elements
      const slideElements = document.querySelectorAll('.print-slide');
      
      if (!slideElements.length) {
        alert('No slides found to export');
        setIsPrinting(false);
        setIsExporting(false);
        return;
      }
      
      try {
        // Try using jsPDF first
        const jsPDFClass = (await jsPDFModule).default;
        
        // Create a new PDF in landscape orientation
        const pdf = new jsPDFClass({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Process each slide
        for (let i = 0; i < slideElements.length; i++) {
          try {
            const canvas = await html2canvas(slideElements[i], {
              scale: 2, // Higher scale for better quality
              useCORS: true,
              logging: false
            });
            
            // Convert canvas to an image
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            // Add a new page for slides after the first one
            if (i > 0) {
              pdf.addPage();
            }
            
            // Calculate the dimensions to maintain aspect ratio but fill the page
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Add the image to the PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          } catch (err) {
            console.error(`Error processing slide ${i + 1}:`, err);
          }
        }
        
        // Save the PDF
        pdf.save(`${deck.title || 'Presentation'}.pdf`);
      } catch (jsPDFError) {
        console.error('jsPDF error:', jsPDFError);
        
        // Fallback: Use print function as a last resort
        window.print();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error exporting PDF: ' + err.message);
      
      // Try browser print as a fallback
      try {
        window.print();
      } catch (printErr) {
        console.error('Print fallback failed:', printErr);
      }
    } finally {
      // Delay resetting to ensure print dialog has time to open
      setTimeout(() => {
        setIsPrinting(false);
        setIsExporting(false);
      }, 1000);
    }
  };
  
  // Simplified fallback PDF export using browser print
  const handlePrintPDF = () => {
    // Save current content first
    saveCurrentSlideContent();
    
    // Set printing mode to show all slides
    setIsPrinting(true);
    
    // Wait for the print layout to render
    setTimeout(() => {
      window.print();
      // Restore normal view after print dialog is closed or after timeout
      setTimeout(() => {
        setIsPrinting(false);
      }, 1000);
    }, 500);
  };

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!deck) return <div>Deck not found</div>;

  return (
    <div className="flex h-screen bg-gray-800">
      {/* Hide sidebar when printing */}
      {!isPrinting && (
        <div className="w-64 bg-gray-900 p-4 overflow-y-auto text-white">
          <h2 className="text-xl font-bold mb-4 text-blue-400">{deck.title}</h2>
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-full p-2 text-left rounded ${
                  currentSlide === index ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                }`}
              >
                Slide {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-600 transition"
            >
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition disabled:bg-gray-500"
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={handlePrintPDF}
              disabled={isPrinting}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition disabled:bg-gray-500"
            >
              Print to PDF
            </button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className={`${isPrinting ? 'w-full' : 'flex-1'} p-8 overflow-y-auto bg-gray-700 flex items-center justify-center`}>
        <div ref={slidesContainerRef} className="presentation-frame" style={{ width: '90%', maxWidth: '1200px' }}>
          {/* Slide Navigation Controls - Hide when printing */}
          {!isPrinting && (
            <div className="flex justify-between mb-4">
              <button 
                onClick={() => currentSlide > 0 && handleSlideChange(currentSlide - 1)}
                disabled={currentSlide === 0}
                className="bg-gray-800 text-white p-2 rounded-full disabled:opacity-50"
                aria-label="Previous slide"
              >
                ← Prev
              </button>
              <div className="text-white">
                Slide {currentSlide + 1} of {slides.length}
              </div>
              <button 
                onClick={() => currentSlide < slides.length - 1 && handleSlideChange(currentSlide + 1)}
                disabled={currentSlide === slides.length - 1}
                className="bg-gray-800 text-white p-2 rounded-full disabled:opacity-50"
                aria-label="Next slide"
              >
                Next →
              </button>
            </div>
          )}

          {/* Slide Content - Either current slide or all slides for printing */}
          {isPrinting ? (
            // All slides for PDF export
            <div className="print-all-slides">
              {slides.map((slide, index) => (
                <div key={index} className="slide-for-print mb-10">
                  <div 
                    className="bg-white rounded-lg shadow-2xl overflow-hidden print-slide"
                    style={{ 
                      aspectRatio: '16/9',
                      border: '1px solid #2d3748',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      marginBottom: '50px'
                    }}
                  >
                    <div
                      className="slide-container"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: slide.content || '' }}
                        className="slide-content"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0, 
                          bottom: 0,
                          overflow: 'hidden'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single editable slide
            <div className="slide-frame">
              <div 
                ref={pdfRef} 
                className="bg-white rounded-lg shadow-2xl overflow-hidden"
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
                    height: '100%'
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
                      outline: 'none'
                    }}
                    onBlur={saveCurrentSlideContent}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Basic formatting toolbar - Hide when printing */}
          {!isPrinting && (
            <div className="mt-4 bg-gray-800 rounded p-2 flex flex-wrap gap-2 justify-center">
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('bold')}
                title="Bold"
              >
                Bold
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('italic')}
                title="Italic"
              >
                Italic
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('formatBlock', false, 'h1')}
                title="Heading 1"
              >
                H1
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('formatBlock', false, 'h2')}
                title="Heading 2"
              >
                H2
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('formatBlock', false, 'p')}
                title="Paragraph"
              >
                Paragraph
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('insertUnorderedList')}
                title="Bullet List"
              >
                • List
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('insertOrderedList')}
                title="Numbered List"
              >
                1. List
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('justifyCenter')}
                title="Center"
              >
                Center
              </button>
              <button 
                className="text-white bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                onClick={() => document.execCommand('justifyLeft')}
                title="Left Align"
              >
                Left
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 