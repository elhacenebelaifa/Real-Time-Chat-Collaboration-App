import { useState, useRef } from "react";
import { api } from "../../lib/api";
import styles from "../../styles/Chat.module.css";

export default function MessageInput({ onSend, onTyping, roomId, disabled }) {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        }
    };

    return (
        <div className={styles.messageInputArea}>
            {file && (
                <div className={styles.filePreview}>
                    <span>{file.name}</span>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                        className={styles.filePreviewRemove}
                        onClick={() => setFile(null)}
                    >
                        x
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
                    title="Attach file"
                >
                    +
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
                    title="Send"
                >
                    {uploading ? "..." : ">"}
                </button>
            </form>
        </div>
    );
}
