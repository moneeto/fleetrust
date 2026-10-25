"use client";

import { useEffect, useRef, useState } from "react";
import { ApiComunicator } from "@/helpers/ApiComunicator";
import Config from "@/config";
import { Button, Modal, ModalBody } from "reactstrap";
import MessageModal from "@/components/ui/MessageModal";
import { useToast } from "@/components/ui/use-toast";
import { TrashIcon, UploadIcon, XIcon } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import styles from "./page.module.css";

export default function ToursGalleryPage() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    const imageUrl = (filename) =>
        `${Config.endpoint}/toursGallery/file/${encodeURIComponent(filename)}`;

    async function fetchImages() {
        try {
            setLoading(true);
            setError(null);
            const res = await ApiComunicator("/toursGallery", "GET");
            setImages(res.images || []);
        } catch (err) {
            setError(err.message || "Error loading gallery");
            setImages([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchImages();
    }, []);

    const onFilesSelected = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (!files.length) return;

        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));

        try {
            setUploading(true);
            await ApiComunicator("/toursGallery/upload", "POST", formData);
            toast({
                title: "Images uploaded",
                description: `${files.length} image${files.length === 1 ? "" : "s"} converted to WebP.`,
            });
            await fetchImages();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error uploading images",
            });
        } finally {
            setUploading(false);
        }
    };

    const confirmDelete = async () => {
        const filename = deleteConfirm;
        if (!filename) return;

        try {
            setLoading(true);
            await ApiComunicator("/toursGallery/delete", "POST", { filename });
            setImages((prev) => prev.filter((img) => img.filename !== filename));
            if (preview?.filename === filename) setPreviewOpen(false);
            setDeleteConfirm(null);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error deleting image",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {(loading || uploading) && <Spinner overlay />}

            <div className={styles.uploadCard}>
                <div>
                    <h6 className="mb-1">Upload images</h6>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="d-none"
                        onChange={onFilesSelected}
                    />
                    <Button
                        color="primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <UploadIcon size={16} className="me-2" />
                        {uploading ? "Uploading..." : "Select images"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger mb-0">{error}</div>
            )}

            {!error && !loading && images.length === 0 && (
                <div className={styles.empty}>
                    No images in the gallery yet.
                </div>
            )}

            {images.length > 0 && (
                <div className={styles.grid}>
                    {images.map((image) => (
                        <div key={image.filename} className={styles.thumbWrap}>
                            <button
                                type="button"
                                className={styles.thumbButton}
                                onClick={() => { setPreview(image); setPreviewOpen(true); }}
                            >
                                <img
                                    src={imageUrl(image.filename)}
                                    alt={image.filename}
                                    className={styles.thumb}
                                    crossOrigin="use-credentials"
                                />
                            </button>
                            <button
                                type="button"
                                className={styles.deleteBtn}
                                title="Delete image"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(image.filename);
                                }}
                            >
                                <TrashIcon size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={previewOpen}
                toggle={() => setPreviewOpen(false)}
                onClosed={() => { if (!previewOpen) setPreview(null); }}
                centered
                size="lg"
                contentClassName={styles.previewModal}
            >
                <button
                    type="button"
                    className={styles.closePreview}
                    onClick={() => setPreviewOpen(false)}
                    aria-label="Close"
                >
                    <XIcon size={20} />
                </button>
                <ModalBody className={styles.previewBody}>
                    {preview && (
                        <img
                            src={imageUrl(preview.filename)}
                            alt={preview.filename}
                            className={styles.previewImage}
                            crossOrigin="use-credentials"
                        />
                    )}
                </ModalBody>
            </Modal>

            <MessageModal
                isOpen={!!deleteConfirm}
                type="confirm"
                title="Delete image"
                confirmLabel="Delete"
                confirmColor="danger"
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
            >
                Delete this image from the gallery?
            </MessageModal>
        </div>
    );
}
