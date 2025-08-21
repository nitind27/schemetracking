'use client'
import React, { useState } from 'react';
import CustomModel from '../../common/CustomModel';

const FullScreenModalExample: React.FC = () => {
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Sample data for display mode - exactly like your image format
  const sampleData = [
    { label: 'Latitude', value: '21.823477', unit: '' },
    { label: 'Longitude', value: '74.198747', unit: '' },
    { label: 'Elevation', value: '380.78', unit: '± 5 meters' },
    { label: 'Accuracy', value: '8.7', unit: 'meters' },
    { label: 'Time', value: '11-10-2023 12:31', unit: '' },
  ];

  const sampleNote = 'CFR क्षेत्र शिवारफेरी कार्यक्रम';

  // Sample fields for form mode
  const formFields = [
    { name: 'latitude', type: 'text' as const, label: 'Latitude' },
    { name: 'longitude', type: 'text' as const, label: 'Longitude' },
    { name: 'elevation', type: 'number' as const, label: 'Elevation' },
    { name: 'accuracy', type: 'number' as const, label: 'Accuracy' },
    { name: 'timestamp', type: 'date' as const, label: 'Time' },
  ];

  const handleFormSubmit = (data: { [key: string]: string | number }) => {
    console.log('Form submitted:', data);
    setIsFormModalOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Full Screen Modal Examples</h2>
      
      {/* Data Display Modal - Full Screen */}
      <div>
        <button
          onClick={() => setIsDataModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4"
        >
          Open Full Screen Data Display
        </button>
        
        <CustomModel
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          title="Geographical Data"
          isFullScreen={true}
          data={sampleData}
          note={sampleNote}
        />
      </div>

      {/* Form Modal - Full Screen */}
      <div>
        <button
          onClick={() => setIsFormModalOpen(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Open Full Screen Form
        </button>
        
        <CustomModel
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title="Data Entry Form"
          fields={formFields}
          onSubmit={handleFormSubmit}
          isFullScreen={true}
        />
      </div>
    </div>
  );
};

export default FullScreenModalExample;
