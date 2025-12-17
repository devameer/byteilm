/**
 * Remove empty parameters from an object
 * @param {Object} params - The parameters object
 * @returns {Object} - Cleaned parameters object without empty values
 */
export const cleanParams = (params) => {
    const cleaned = {};
    Object.keys(params).forEach(key => {
        const value = params[key];
        // Only include if value is not empty string, null, undefined, or "all"
        if (value !== "" && value !== null && value !== undefined && value !== "all") {
            // Convert boolean strings to actual booleans for certain fields
            if (key === 'with_stats' || key === 'active_courses_only' || key === 'is_lesson') {
                cleaned[key] = value === true || value === 'true' || value === 1 || value === '1';
            } else {
                cleaned[key] = value;
            }
        }
    });
    return cleaned;
};

/**
 * Build query string from parameters object, excluding empty values
 * @param {Object} params - The parameters object
 * @returns {string} - Query string
 */
export const buildQueryString = (params) => {
    const cleaned = cleanParams(params);
    const queryString = new URLSearchParams(cleaned).toString();
    return queryString ? `?${queryString}` : '';
};
