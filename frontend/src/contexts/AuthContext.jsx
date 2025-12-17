import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

const USER_CACHE_KEY = 'cached_user_data';
const USER_CACHE_TIMESTAMP_KEY = 'cached_user_timestamp';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (reduced from 5)
const MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes max (reduced from 30)

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Try to load from cache on initial mount
        try {
            const cachedUser = localStorage.getItem(USER_CACHE_KEY);
            const cachedTimestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);

            if (cachedUser && cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp, 10);
                if (age < CACHE_DURATION) {
                    return JSON.parse(cachedUser);
                }
            }
        } catch (error) {
            console.error('Failed to load cached user:', error);
        }
        return null;
    });
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        if (!authService.isAuthenticated()) {
            setLoading(false);
            // Clear cache if not authenticated
            localStorage.removeItem(USER_CACHE_KEY);
            localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
            setUser(null);
            return;
        }

        try {
            const response = await authService.getUser();
            if (response.success) {
                setUser(response.data);
                // Cache the user data with fresh timestamp
                try {
                    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data));
                    localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
                } catch (cacheError) {
                    console.error('Failed to cache user data:', cacheError);
                }
            } else {
                // API returned failure - clear everything
                console.warn('User API returned failure, clearing auth data');
                localStorage.removeItem('auth_token');
                localStorage.removeItem(USER_CACHE_KEY);
                localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
                setUser(null);
            }
        } catch (error) {
            // Ignore canceled errors (they're not real errors)
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                // Keep current user state if request was cancelled
                setLoading(false);
                return;
            }

            // Check if it's a 401 (unauthorized) - only then clear everything
            const isUnauthorized = error?.response?.status === 401;
            
            if (isUnauthorized) {
                // Token is invalid, clear everything
                console.error('Authentication failed - token invalid:', error);
                localStorage.removeItem('auth_token');
                localStorage.removeItem(USER_CACHE_KEY);
                localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
                setUser(null);
            } else {
                // Network error or other error - keep cached user if available
                console.error('Failed to load user (keeping cached data):', error);
                const cachedUser = localStorage.getItem(USER_CACHE_KEY);
                const cachedTimestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
                
                if (cachedUser && cachedTimestamp) {
                    try {
                        const age = Date.now() - parseInt(cachedTimestamp, 10);
                        // Keep cache only if it's less than MAX_CACHE_AGE (10 minutes)
                        if (age < MAX_CACHE_AGE) {
                            const parsed = JSON.parse(cachedUser);
                            setUser(parsed);
                        } else {
                            // Cache too old, clear it
                            localStorage.removeItem(USER_CACHE_KEY);
                            localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
                            setUser(null);
                        }
                    } catch (e) {
                        // Invalid cache, clear it
                        localStorage.removeItem(USER_CACHE_KEY);
                        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = useCallback(async (email, password) => {
        const response = await authService.login(email, password);
        if (response.success) {
            setUser(response.data.user);
            // Cache the user data
            try {
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
                localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
            } catch (cacheError) {
                console.error('Failed to cache user data:', cacheError);
            }
        }
        return response;
    }, []);

    const register = useCallback(async (name, email, password, passwordConfirmation, referralCode = null) => {
        const response = await authService.register(
            name,
            email,
            password,
            passwordConfirmation,
            referralCode
        );
        if (response.success) {
            setUser(response.data.user);
            // Cache the user data
            try {
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data.user));
                localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
            } catch (cacheError) {
                console.error('Failed to cache user data:', cacheError);
            }
        }
        return response;
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        // Clear cache on logout
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
    }, []);

    const value = React.useMemo(() => ({
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: loadUser,
    }), [user, loading, login, register, logout, loadUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
