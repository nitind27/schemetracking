'use client';
import { createContext, useState, ReactNode, useContext } from 'react';

// Type Definitions
type ToggleContextType = {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
};

// Context Creation
const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

// Custom Hook for Safe Access
export function useToggleContext() {
  const context = useContext(ToggleContext);
  if (!context) {
    throw new Error('useToggleContext must be used within a ToggleProvider');
  }
  return context;
}

// Provider Component
type ToggleProviderProps = {
  children: ReactNode;
};

export function ToggleProvider({ children }: ToggleProviderProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <ToggleContext.Provider value={{ isActive, setIsActive }}>
      {children}
    </ToggleContext.Provider>
  );
}
