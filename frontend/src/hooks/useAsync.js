import { useState, useCallback } from "react";

export function useAsync(initialState = {}) {
    const [data, setData] = useState(initialState.data || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const run = useCallback(async (promise) => {
        setLoading(true);
        setError(null);
        try {
            const result = await (typeof promise === "function" ? promise() : promise);
            setData(result);
            return result;
        } catch (err) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                // Don't set error for canceled requests
                setLoading(false);
                return;
            }
            
            // Format error message for better UX
            const errorMessage = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء تحميل البيانات';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(initialState.data || null);
        setLoading(false);
        setError(null);
    }, [initialState.data]);

    return { data, loading, error, run, reset };
}
