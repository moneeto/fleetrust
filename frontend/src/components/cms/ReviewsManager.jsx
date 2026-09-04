"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Button, Input, Label } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDown, ArrowUp, Plus, TrashIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import styles from "./cms.module.css";

function starsLabel(n) {
    const count = Math.max(0, Math.min(5, Number(n) || 0));
    return "★".repeat(count) + "☆".repeat(5 - count);
}

export default function ReviewsManager({ target }) {
    const isTours = target === "TOURS";
    const [reviews, setReviews] = useState([]);
    const [name, setName] = useState("");
    const [stars, setStars] = useState(5);
    const [review, setReview] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    async function load() {
        const res = await ApiComunicator(`/reviews?target=${target}`, "GET");
        setReviews(res.reviews || []);
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
    }, [target]);

    const addReview = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            const res = await ApiComunicator("/reviews", "POST", {
                target,
                name: name.trim(),
                stars: Number(stars),
                review: review.trim(),
            });
            setReviews(res.reviews || []);
            setName("");
            setStars(5);
            setReview("");
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const remove = async (item) => {
        try {
            const res = await ApiComunicator("/reviews/delete", "POST", { target, id: item.id });
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
                target,
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
            <form className={styles.toolbar} onSubmit={addReview} style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className={styles.formRow}>
                    <div style={{ flex: 1 }}>
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reviewer name" required />
                    </div>
                    <div style={{ width: "8rem" }}>
                        <Label>Stars</Label>
                        <Input type="select" value={stars} onChange={(e) => setStars(e.target.value)}>
                            {[5, 4, 3, 2, 1].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </Input>
                    </div>
                </div>
                <div>
                    <Label>Review</Label>
                    <Input type="textarea" rows={3} value={review} onChange={(e) => setReview(e.target.value)} required />
                </div>
                <div>
                    <Button color="primary" type="submit" disabled={saving}>
                        <Plus size={16} className="me-1" />
                        Add
                    </Button>
                </div>
            </form>

            {!reviews.length ? (
                <div className={styles.empty}>No reviews yet.</div>
            ) : (
                <div className={styles.list}>
                    {reviews.map((item, index) => (
                        <article
                            key={item.id}
                            className={`${styles.reviewCard} ${isTours ? styles.reviewCardTours : styles.reviewCardAviation}`}
                        >
                            <div className={styles.reviewCardTop}>
                                <div>
                                    <p className={styles.reviewBrand}>{isTours ? "Frassi Tours" : "Frassi Aviation"}</p>
                                    <p className={styles.reviewCardName}>{item.name}</p>
                                    <div className={styles.stars}>{starsLabel(item.stars)}</div>
                                </div>
                                <div className={styles.actions} style={{ flexDirection: "row" }}>
                                    {reviews.length > 1 ? (
                                        <>
                                            <Button size="sm" outline disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up">
                                                <ArrowUp size={14} />
                                            </Button>
                                            <Button size="sm" outline disabled={index === reviews.length - 1} onClick={() => move(index, 1)} aria-label="Move down">
                                                <ArrowDown size={14} />
                                            </Button>
                                        </>
                                    ) : null}
                                    <Button size="sm" color="danger" outline onClick={() => remove(item)}>
                                        <TrashIcon size={14} />
                                    </Button>
                                </div>
                            </div>
                            <p className={styles.excerpt}>{item.review}</p>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
