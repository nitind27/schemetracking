"use client";

import { useEffect } from "react";

// Client component to restore user data from server if auth cookie exists
// Also handles clearing cookies when session storage is cleared or browser closes
export default function AuthCleanup() {
  useEffect(() => {
    const restoreUserSession = async () => {
      try {
        // Check if user data already exists in sessionStorage
        const existingUserName = sessionStorage.getItem('userName');
        if (existingUserName) {
          return; // User data already exists, no need to fetch
        }

        // Check if auth_token cookie exists
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        
        if (authCookie) {
          // Cookie exists, try to restore user data from server
          const response = await fetch('/api/auth/me');
          
          if (response.ok) {
            const data = await response.json();
            
            // Restore user data in sessionStorage
            if (data.user) {
              sessionStorage.setItem('userName', data.user.name);
              sessionStorage.setItem('user_id', data.user.user_id?.toString() || '');
              sessionStorage.setItem('category_name', data.user.category_name);
              sessionStorage.setItem('category_id', data.user.category_id);
              sessionStorage.setItem('village_id', data.user.village_id);
              sessionStorage.setItem('taluka_id', data.user.taluka_id);
            }
          } else {
            // Invalid token, clear any remaining sessionStorage
            sessionStorage.clear();
          }
        } else {
          // No auth cookie, clear sessionStorage
          sessionStorage.clear();
        }
      } catch (error) {
        console.error('Error restoring user session:', error);
        // On error, clear sessionStorage to be safe
        sessionStorage.clear();
      }
    };

    restoreUserSession();
  }, []);

  useEffect(() => {
    // Function to clear auth cookie via API
    const clearAuthCookie = async () => {
      try {
        // Call logout API to clear the httpOnly cookie
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        // Silently fail if API call doesn't work (e.g., browser closing)
        console.error('Error clearing auth cookie:', error);
      }
    };

    // Override sessionStorage.clear() to clear cookie when sessionStorage is cleared
    const originalClear = sessionStorage.clear.bind(sessionStorage);
    sessionStorage.clear = function() {
      // Check if auth token exists before clearing
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
      if (authCookie) {
        // Clear the cookie before clearing sessionStorage
        clearAuthCookie();
      }
      // Call original clear
      originalClear();
    };

    // Listen for storage events (when sessionStorage is cleared from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      // Check if sessionStorage was cleared
      if (e.key === null && e.newValue === null) {
        // SessionStorage was cleared, clear the cookie
        clearAuthCookie();
      }
    };

    // Listen for beforeunload (when browser is closing)
    const handleBeforeUnload = () => {
      // Check if sessionStorage has user data
      const userName = sessionStorage.getItem('userName');
      if (userName) {
        // Try to clear cookie before browser closes using fetch with keepalive
        // This works better than sendBeacon for POST requests
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          keepalive: true,
        }).catch(() => {
          // Silently fail - browser may be closing
        });
      }
    };

    // Monitor sessionStorage changes by checking periodically
    // This catches cases where sessionStorage is cleared programmatically
    let lastSessionStorageLength = sessionStorage.length;
    const checkSessionStorage = () => {
      const currentLength = sessionStorage.length;
      const userName = sessionStorage.getItem('userName');
      
      // If sessionStorage was cleared (length decreased and userName is gone)
      if (currentLength < lastSessionStorageLength && !userName) {
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        if (authCookie) {
          clearAuthCookie();
        }
      }
      
      lastSessionStorageLength = currentLength;
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check sessionStorage periodically (every 1 second)
    const intervalId = setInterval(checkSessionStorage, 1000);

    // Cleanup
    return () => {
      // Restore original clear function
      sessionStorage.clear = originalClear;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}

