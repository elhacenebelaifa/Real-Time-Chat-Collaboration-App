import { useState, useRef, useEffect } from "react";
import { api } from "../../lib/api";
import styles from "../../styles/Chat.module.css";

export default function MessageInput({ onSend, onTyping, roomId, disabled }) {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);
    const errorTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadError(null);
        const trimmed = text.trim();
        if (!trimmed && !file) return;

        if (file) {
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("roomId", roomId);
                const uploadResult = await api.upload(
                    "/files/upload",
                    formData
                );
                onSend(trimmed, "file", {
                    fileId: uploadResult.fileId,
                    fileName: uploadResult.originalName,
                    fileSize: uploadResult.size,
                    mimeType: uploadResult.mimeType,
                    url: uploadResult.url
                });
            } catch (err) {
                console.error("File upload failed:", err);
                setUploadError("File upload failed. Please try again.");
                errorTimerRef.current = setTimeout(() => setUploadError(null), 5000);
            } finally {
                setUploading(false);
                setFile(null);
            }
        } else {
            onSend(trimmed, "text");
        }
        setText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setUploadError(null);
        }
    };

    return (
        <div className={styles.messageInputArea}>
            {uploadError && (
                <div className={styles.uploadError}>
                    <span>{uploadError}</span>
                    <button
                        className={styles.uploadErrorDismiss}
                        onClick={() => setUploadError(null)}
                        aria-label="Dismiss error"
                    >
                        ✕
                    </button>
                </div>
            )}
            {file && (
                <div className={styles.filePreview}>
                    <span>{file.name}</span>
                    <span className={styles.fileSizeMeta}>
                        ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                        className={styles.filePreviewRemove}
                        onClick={() => setFile(null)}
                        aria-label="Remove attached file"
                    >
                        ✕
                    </button>
                </div>
            )}
            <form className={styles.messageForm} onSubmit={handleSubmit}>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                />
                <button
                    type="button"
                    className={styles.attachButton}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                    title="Attach file"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>
                <textarea
                    className={styles.messageTextarea}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (onTyping) onTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    disabled={disabled || uploading}
                />
                <button
                    type="submit"
                    className={styles.sendButton}
                    disabled={disabled || uploading || (!text.trim() && !file)}
                    aria-label="Send message"
                    title="Send"
                >
                    {uploading ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
