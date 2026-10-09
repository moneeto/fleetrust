"use client";

import { useEffect, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import { Button, Input } from "reactstrap";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Plus, TrashIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import styles from "./cms.module.css";

export default function SocialManager({ brand }) {
    const [posts, setPosts] = useState([]);
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    async function load() {
        const res = await ApiComunicator(`/instagram?brand=${brand}`, "GET");
        setPosts(res.posts || []);
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
                        description: err.message || "Could not load posts",
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

    const addPost = async (event) => {
        event.preventDefault();
        if (!url.trim()) return;
        try {
            setSaving(true);
            const res = await ApiComunicator("/instagram", "POST", { brand, permalink: url.trim() });
            setPosts(res.posts || []);
            setUrl("");
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const toggleVisible = async (post) => {
        try {
            const res = await ApiComunicator("/instagram/update", "POST", {
                brand,
                id: post.id,
                visible: !post.visible,
            });
            setPosts(res.posts || []);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    };

    const remove = async (post) => {
        try {
            const res = await ApiComunicator("/instagram/delete", "POST", { brand, id: post.id });
            setPosts(res.posts || []);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    };

    const move = async (index, dir) => {
        const next = [...posts];
        const swap = index + dir;
        if (swap < 0 || swap >= next.length) return;
        [next[index], next[swap]] = [next[swap], next[index]];
        setPosts(next);
        try {
            const res = await ApiComunicator("/instagram/order", "POST", {
                brand,
                ids: next.map((item) => item.id),
            });
            setPosts(res.posts || next);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: err.message });
            load().catch(() => {});
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className={styles.page}>
            <form className={styles.toolbar} onSubmit={addPost}>
                <p>Paste an Instagram post or reel URL.</p>
                <div className={styles.formRow}>
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.instagram.com/p/..."
                    />
                    <Button color="primary" type="submit" disabled={saving}>
                        <Plus size={16} className="me-1" />
                        Add
                    </Button>
                </div>
            </form>

            {!posts.length ? (
                <div className={styles.empty}>
                    No Instagram posts yet.
                </div>
            ) : (
                <div className={styles.socialGrid}>
                    {posts.map((post, index) => (
                        <article
                            key={post.id}
                            className={`${styles.socialCard}${post.visible ? "" : ` ${styles.socialCardHidden}`}`}
                        >
                            <div className={styles.socialMeta}>
                                <strong>
                                    {post.media_kind === "p" ? "Post" : "Reel"}
                                    {!post.visible ? <span className={styles.hiddenBadge}>Hidden</span> : null}
                                </strong>
                            </div>
                            <iframe
                                className={styles.socialEmbed}
                                title={`Instagram ${post.shortcode}`}
                                src={post.embedUrl}
                                loading="lazy"
                                allow="encrypted-media; picture-in-picture"
                            />
                            <p className={styles.permalink}>
                                <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                                    Open on Instagram
                                </a>
                            </p>
                            <div className={styles.socialActions}>
                                <Button size="sm" color={post.visible ? "secondary" : "success"} onClick={() => toggleVisible(post)}>
                                    {post.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                                    <span className="ms-1">{post.visible ? "Hide" : "Show"}</span>
                                </Button>
                                {posts.length > 1 ? (
                                    <>
                                        <Button size="sm" outline disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move left">
                                            <ArrowLeft size={14} />
                                        </Button>
                                        <Button size="sm" outline disabled={index === posts.length - 1} onClick={() => move(index, 1)} aria-label="Move right">
                                            <ArrowRight size={14} />
                                        </Button>
                                    </>
                                ) : null}
                                <Button size="sm" color="danger" outline onClick={() => remove(post)}>
                                    <TrashIcon size={14} />
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
