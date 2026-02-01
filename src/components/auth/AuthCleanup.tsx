"use client";

import { useEffect } from "react";

// Client component to restore user data from server if auth cookie exists
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

  return null;
}

