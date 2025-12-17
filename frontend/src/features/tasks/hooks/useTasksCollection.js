import { useCallback, useEffect, useState } from "react";
import taskService from "../../../services/taskService";
import { useAsync } from "../../../hooks/useAsync";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { DEFAULT_FILTERS, STATS_TEMPLATE } from "../constants";

export function useTasksCollection(initialFilters = DEFAULT_FILTERS) {
    const [filters, setFilters] = useState(initialFilters);
    const debouncedSearch = useDebouncedValue(filters.search, 350);
    const { data, loading, error, run } = useAsync({
        data: { items: [], stats: STATS_TEMPLATE, meta: {} },
    });

    const fetchTasks = useCallback(async () => {
        try {
            const response = await taskService.list({ ...filters, search: debouncedSearch, with_stats: true });
            if (response.success) {
                return {
                    items: Array.isArray(response.data) ? response.data : response.data?.items ?? [],
                    stats: { ...STATS_TEMPLATE, ...(response.stats || {}) },
                    meta: response.meta ?? {},
                };
            }
            // If API returns failure but no error, return empty data
            return { items: [], stats: STATS_TEMPLATE, meta: {} };
        } catch (error) {
            // Ignore canceled errors (they're not real errors, just duplicate request prevention)
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                // Return empty data instead of throwing
                return { items: [], stats: STATS_TEMPLATE, meta: {} };
            }
            // Re-throw other errors so useAsync can handle them
            throw error;
        }
    }, [debouncedSearch, filters]);

    useEffect(() => {
        run(fetchTasks);
    }, [fetchTasks, run]);

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    return {
        filters,
        setFilter: updateFilter,
        resetFilters,
        tasks: data.items,
        stats: data.stats,
        meta: data.meta,
        loading,
        error,
        refresh: () => run(fetchTasks),
    };
}
