import { useState, useEffect } from 'react';

interface UserData {
  name: string;
  user_id: string;
  category_name: string;
  category_id: string;
  taluka_id: string;
  village_id: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = () => {
      try {
        const userName = sessionStorage.getItem('userName');
        const userId = sessionStorage.getItem('user_id');
        const categoryName = sessionStorage.getItem('category_name');
        const categoryId = sessionStorage.getItem('category_id');
        const talukaId = sessionStorage.getItem('taluka_id');
        const villageId = sessionStorage.getItem('village_id');

        if (userName && categoryName && categoryId) {
          setUser({
            name: userName,
            user_id: userId || '',
            category_name: categoryName,
            category_id: categoryId,
            taluka_id: talukaId || '',
            village_id: villageId || ''
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Listen for storage changes (in case data is updated in another tab)
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const refreshUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.user) {
          // Update sessionStorage
          sessionStorage.setItem('userName', data.user.name);
          sessionStorage.setItem('user_id', data.user.user_id?.toString() || '');
          sessionStorage.setItem('category_name', data.user.category_name);
          sessionStorage.setItem('category_id', data.user.category_id);
          sessionStorage.setItem('village_id', data.user.village_id);
          sessionStorage.setItem('taluka_id', data.user.taluka_id);
          
          // Update state
          setUser({
            name: data.user.name,
            user_id: data.user.user_id?.toString() || '',
            category_name: data.user.category_name,
            category_id: data.user.category_id,
            taluka_id: data.user.taluka_id,
            village_id: data.user.village_id
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    refreshUserData
  };
}