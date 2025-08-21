'use client'
import React from 'react';

type DataItem = {
  label: string;
  value: string | number;
  unit?: string;
};

type FullScreenModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: DataItem[];
  imageUrl?: string;
  note?: string;
};

const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  imageUrl,
  note
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm">
      <div className="w-full h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side - Image */}
          {imageUrl && (
            <div className="lg:w-2/3 h-full overflow-hidden">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Right Side - Data */}
          <div className="lg:w-1/3 h-full bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Data Items */}
              <div className="space-y-4">
                {data.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        {item.label}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {item.value}
                        {item.unit && (
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {item.unit}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note Section */}
              {note && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Note:</h3>
                  <p className="text-blue-700 text-sm">{note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenModal;