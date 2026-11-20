"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { startPushNotifications } from "@/helpers/pushNotifications";

// Renders nothing. Put it once inside the logged-in layout.
export default function PushNotifications() {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        let stopListening = null;
        let wasUnmounted = false;

        startPushNotifications({
            onReceive: (notification) => toast({ title: notification.title, description: notification.body }),
            onOpen: (url) => url && router.push(url),
        }).then((stop) => {
            if (wasUnmounted) stop();
            else stopListening = stop;
        });

        return () => {
            wasUnmounted = true;
            if (stopListening) stopListening();
        };
    }, []);

    return null;
}
