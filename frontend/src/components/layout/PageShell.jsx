import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import DataState from "../feedback/DataState";

function PageShell({ title, description, actions, loading, error, onRetry, children }) {
    const { darkMode } = useTheme();
    
    return (
        <div className="space-y-6">
            {(title || description || actions) && (
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        {title && (
                            <h1 className={`text-3xl font-bold flex items-center gap-3 transition-colors duration-300 ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className={`mt-1 text-sm transition-colors duration-300 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </div>
            )}
            <DataState loading={loading} error={error} onRetry={onRetry}>
                {children}
            </DataState>
        </div>
    );
}

export default PageShell;
