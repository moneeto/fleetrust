"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Button } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDown, ArrowUp, Eye, EyeOff, RefreshCw } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import styles from "./cms.module.css";

function stars(n) {
    const count = Math.max(0, Math.min(5, Number(n) || 0));
    return "★".repeat(count) + "☆".repeat(5 - count);
}

export default function ReviewsManager({ brand }) {
    const [reviews, setReviews] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { toast } = useToast();

    async function load() {
        const res = await ApiComunicator(`/reviews?brand=${brand}`, "GET");
        setReviews(res.reviews || []);
        setMeta(res.meta || null);
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                await load();
            } catch (err) {
                if (!cancelled) {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: err.message || "Could not load reviews",
                    });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [brand]);

    const sync = async () => {
        try {
            setSyncing(true);
            const res = await ApiComunicator("/reviews/sync", "POST", { brand });
            setReviews(res.reviews || []);
            setMeta(res.meta || null);
            toast({
                title: "Synced from Google",
                description: `${res.inserted || 0} new, ${res.updated || 0} updated. New reviews stay hidden until you show them.`,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Could not sync",
                description: err.message || "Check Google Places API key and Place IDs.",
            });
        } finally {
            setSyncing(false);
        }
    };

    const toggleVisible = async (review) => {
        try {
            const res = await ApiComunicator("/reviews/update", "POST", {
                brand,
                id: review.id,
                visible: !review.visible,
            });
            setReviews(res.reviews || []);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    };

    const move = async (index, dir) => {
        const next = [...reviews];
        const swap = index + dir;
        if (swap < 0 || swap >= next.length) return;
        [next[index], next[swap]] = [next[swap], next[index]];
        setReviews(next);
        try {
            const res = await ApiComunicator("/reviews/order", "POST", {
                brand,
                ids: next.map((item) => item.id),
            });
            setReviews(res.reviews || next);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
            load().catch(() => {});
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <div>
                    <p>
                        Google reviews - Only visible Google reviews will be displayed on the landing page.
                    </p>
                </div>
                <Button color="primary" onClick={sync} disabled={syncing}>
                    <RefreshCw size={16} className="me-1" />
                    {syncing ? "Syncing..." : "Sync from Google"}
                </Button>
            </div>

            {!reviews.length ? (
                <div className={styles.empty}>No reviews yet.</div>
            ) : (
                <div className={styles.list}>
                    {reviews.map((review, index) => (
                        <article key={review.id} className={styles.card}>
                            {review.author_photo ? (
                                <img
                                    className={styles.avatar}
                                    src={review.author_photo}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className={styles.avatar} />
                            )}
                            <div>
                                <strong>{review.author_name}</strong>
                                {!review.visible ? <span className={styles.hiddenBadge}>Hidden</span> : null}
                                <div className={styles.stars}>{stars(review.rating)}</div>
                                <p className={styles.meta}>{review.relative_time}</p>
                                <p className={styles.excerpt}>{review.review_text}</p>
                            </div>
                            <div className={styles.actions}>
                                <Button size="sm" color={review.visible ? "secondary" : "success"} onClick={() => toggleVisible(review)}>
                                    {review.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                                    <span className="ms-1">{review.visible ? "Hide" : "Show"}</span>
                                </Button>
                                <Button size="sm" outline disabled={index === 0} onClick={() => move(index, -1)}>
                                    <ArrowUp size={14} />
                                </Button>
                                <Button size="sm" outline disabled={index === reviews.length - 1} onClick={() => move(index, 1)}>
                                    <ArrowDown size={14} />
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
