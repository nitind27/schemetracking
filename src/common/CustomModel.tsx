// components/ReusableModal.tsx
'use client'
import React from 'react';

type FieldConfig = {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  label: string;
  options?: { value: string; label: string }[];
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields?: FieldConfig[];
  onSubmit?: (data: { [key: string]: string | number }) => void;
  initialData?: { [key: string]: string | number };
  filters?: FieldConfig[];
  onFilterChange?: (filters: { [key: string]: string | number }) => void;
  isFullScreen?: boolean;
  children?: React.ReactNode;
  data?: Array<{
    label: string;
    value: string | number;
    unit?: string;
  }>;
  note?: string;
};

const CustomModel: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  fields = [],
  onSubmit,
  initialData = {},
  filters = [],
  onFilterChange,
  isFullScreen = false,
  children,
  data,
  note
}) => {
  const [formData, setFormData] = React.useState<{ [key: string]: string | number }>(initialData);
  const [filterValues, setFilterValues] = React.useState<{ [key: string]: string | number }>({});

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filterValues, [name]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  if (!isOpen) return null;

  // Full Screen Modal
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm p-5">
        <div className="w-[1050px] h-full flex flex-col bg-white justify-between rounded-lg shadow-xl mx-auto my-0">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
            <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg 
                width="28" 
                height="28" 
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
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {children ? (
              <div className="p-8">
                {children}
              </div>
            ) : data ? (
              // Data Display Mode - Full Screen
              <div className="p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.map((item, index) => (
                      <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {item.label}
                          </div>
                          <div className="text-3xl font-bold text-gray-900">
                            {item.value}
                            {item.unit && (
                              <span className="text-lg font-normal text-gray-500 ml-2">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note Section */}
                  {note && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">Note:</h3>
                      <p className="text-blue-700 text-lg">{note}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Form Mode - Full Screen
              <div className="p-8">
                <div className="max-w-6xl mx-auto">
                  {/* Filter Section */}
                  {filters.length > 0 && (
                    <div className="mb-8 p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <h3 className="mb-6 text-xl font-semibold text-gray-800">Filters</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filters.map((filter) => (
                          <div key={filter.name}>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              {filter.label}
                            </label>
                            {filter.type === 'select' ? (
                              <select
                                name={filter.name}
                                onChange={handleFilterChange}
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                              >
                                <option value="">Select {filter.label}</option>
                                {filter.options?.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={filter.type}
                                name={filter.name}
                                onChange={handleFilterChange}
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Section */}
                  <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {fields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            {field.label}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              name={field.name}
                              value={formData[field.name]?.toString() || ''}
                              onChange={handleInputChange}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            >
                              <option value="">Select {field.label}</option>
                              {field.options?.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              name={field.name}
                              value={formData[field.name]?.toString() || ''}
                              onChange={handleInputChange}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 mt-8">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-lg font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-lg font-medium"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular Modal (existing code)
  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            ✕  
          </button>
        </div>

        {/* Filter Section */}
        {filters.length > 0 && (
          <div className="p-4 border-b">
            <h3 className="mb-4 text-lg font-medium">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filters.map((filter) => (
                <div key={filter.name}>
                  <label className="block text-sm font-medium mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      name={filter.name}
                      onChange={handleFilterChange}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select {filter.label}</option>
                      {filter.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type}
                      name={filter.name}
                      onChange={handleFilterChange}
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name]?.toString() || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]?.toString() || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomModel;
