'use client'
import React, { useState, useEffect, useRef } from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  alt?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  alt = "Image preview"
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      setHasError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          event.preventDefault();
          handleZoomIn();
          break;
        case '-':
          event.preventDefault();
          handleZoomOut();
          break;
        case '0':
          event.preventDefault();
          handleResetZoom();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleMoveLeft();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleMoveRight();
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleMoveUp();
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleMoveDown();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMoveLeft = () => {
    setPosition(prev => ({ ...prev, x: prev.x + 50 }));
  };

  const handleMoveRight = () => {
    setPosition(prev => ({ ...prev, x: prev.x - 50 }));
  };

  const handleMoveUp = () => {
    setPosition(prev => ({ ...prev, y: prev.y + 50 }));
  };

  const handleMoveDown = () => {
    setPosition(prev => ({ ...prev, y: prev.y - 50 }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/80 text-white border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold truncate max-w-md">{title}</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>Zoom: {Math.round(scale * 100)}%</span>
            <span>•</span>
            <span>Use mouse wheel to zoom</span>
            <span>•</span>
            <span>Arrow keys to move</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Zoom Out (-)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H5v-2h14v2z"/>
              </svg>
            </button>
            <button
              onClick={handleResetZoom}
              className="px-3 py-2 text-xs hover:bg-gray-700 rounded transition-colors"
              title="Reset Zoom (0)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Zoom In (+)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Download Image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Close (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-gray-900 relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white text-lg">Loading image...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4 text-white">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <p className="text-lg">Failed to load image</p>
              <p className="text-sm text-gray-400">Please check the image URL</p>
            </div>
          </div>
        )}

        {!hasError && (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={alt}
            className={`max-w-none transition-transform duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              maxWidth: 'none',
              maxHeight: 'none'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        )}
      </div>

      {/* Footer with shortcuts */}
      <div className="bg-black/80 text-white p-3 border-t border-gray-700">
        <div className="flex justify-center items-center space-x-6 text-sm text-gray-300">
          <span className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">+</kbd>
            <span>Zoom In</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">-</kbd>
            <span>Zoom Out</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">0</kbd>
            <span>Reset</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">←→↑↓</kbd>
            <span>Move</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
