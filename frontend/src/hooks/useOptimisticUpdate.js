import { useState, useCallback } from 'react';

/**
 * Hook for optimistic UI updates
 * Updates UI immediately, then syncs with server
 * 
 * @param {Function} updateFn - Function to call for server update
 * @param {Function} rollbackFn - Function to call if update fails
 * @returns {Object} { optimisticUpdate, isUpdating }
 */
export function useOptimisticUpdate(updateFn, rollbackFn) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const optimisticUpdate = useCallback(
    async (optimisticData, ...args) => {
      setIsUpdating(true);
      setError(null);

      // Store original data for rollback
      const originalData = optimisticData.original || null;

      try {
        // Call update function
        const result = await updateFn(...args);
        
        setIsUpdating(false);
        return result;
      } catch (err) {
        // Rollback on error
        if (rollbackFn && originalData) {
          rollbackFn(originalData);
        }
        
        setError(err);
        setIsUpdating(false);
        throw err;
      }
    },
    [updateFn, rollbackFn]
  );

  return { optimisticUpdate, isUpdating, error };
}

/**
 * Hook for optimistic list updates
 * Useful for adding/removing items from lists
 */
export function useOptimisticList(initialItems = []) {
  const [items, setItems] = useState(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);

  const addOptimistic = useCallback((newItem) => {
    setItems((prev) => [...prev, { ...newItem, _optimistic: true }]);
  }, []);

  const removeOptimistic = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateOptimistic = useCallback((id, updates) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, _optimistic: true } : item
      )
    );
  }, []);

  const syncWithServer = useCallback(async (serverItems) => {
    setIsUpdating(true);
    try {
      setItems(serverItems);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    items,
    setItems,
    addOptimistic,
    removeOptimistic,
    updateOptimistic,
    syncWithServer,
    isUpdating,
  };
}

