"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;

        const media = window.matchMedia(MOBILE_QUERY);
        const update = () => setIsMobile(media.matches);

        update();

        if (media.addEventListener) {
            media.addEventListener("change", update);
            return () => media.removeEventListener("change", update);
        }

        media.addListener(update);
        return () => media.removeListener(update);
    }, []);

    return isMobile;
}
