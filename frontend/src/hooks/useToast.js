import { useState, useCallback } from "react";

export function useToast() {
    const [toast, setToast] = useState(null);

    const show = useCallback((message, tone = "info") => {
        setToast({ message, tone });
    }, []);

    const dismiss = useCallback(() => {
        setToast(null);
    }, []);

    return { toast, show, dismiss };
}
