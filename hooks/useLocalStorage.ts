import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 1. Initialize state with the default value immediately
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 2. Load the data from storage when the component mounts
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadStoredValue();
  }, [key]);

  // 3. Save data to storage whenever it changes
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update React state immediately (optimistic UI update)
      setStoredValue(valueToStore);
      
      // Save to Async Storage
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return [storedValue, setValue];
}