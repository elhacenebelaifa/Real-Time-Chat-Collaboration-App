import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

function isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
}

function isVideoFile(mimeType) {
    return mimeType && mimeType.startsWith('video/');
}

function withToken(url) {
    if (!url || typeof window === 'undefined') return url;
    const token = localStorage.getItem('token');
    if (!token) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}token=${encodeURIComponent(token)}`;
}

function variantUrl(file, label) {
    const v = (file.variants || []).find((x) => x.label === label);
    return v ? withToken(v.url) : null;
}

function ResponsiveImage({ file, className }) {
    const imageVariants = (file.variants || []).filter((v) => v.kind === 'image' && v.width);
    if (!imageVariants.length) {
        return <img src={withToken(file.url)} alt={file.fileName} className={className} />;
    }
    const sorted = [...imageVariants].sort((a, b) => a.width - b.width);
    const srcSet = sorted.map((v) => `${withToken(v.url)} ${v.width}w`).join(', ');
    const display = sorted.find((v) => v.label === 'w1280') || sorted[sorted.length - 1];
    return (
        <img
            src={withToken(display.url)}
            srcSet={srcSet}
            sizes="(max-width: 600px) 90vw, 600px"
            alt={file.fileName}
            className={className}
        />
    );
}

function VideoAttachment({ file, className }) {
    const poster = variantUrl(file, 'poster');
    const high = variantUrl(file, 'high');
    const low = variantUrl(file, 'low');
    const src = high || low || withToken(file.url);
    return (
        <video
            controls
            preload="metadata"
            poster={poster || undefined}
            src={src}
            className={className}
        />
    );
}

function FileLink({ file }) {
    return (
        <a
            href={withToken(file.url)}
            target="_blank"
            rel="noopener noreferrer"
            download={file.fileName}
            className={styles.fileAttachChip}
        >
            <div className={styles.fileAttachIcon}>
                <Icon name="file" />
            </div>
            <div>
                <div className={styles.fileAttachName}>{file.fileName}</div>
                <div className={styles.fileAttachSize}>{file.size || ''}</div>
            </div>
        </a>
    );
}

export default function MessageAttachment({ file }) {
    return (
        <div className={styles.msgAttachment}>
            {isImageFile(file.mimeType) ? (
                <ResponsiveImage file={file} className={styles.msgImage} />
            ) : isVideoFile(file.mimeType) ? (
                <VideoAttachment file={file} className={styles.msgImage} />
            ) : (
                <FileLink file={file} />
            )}
        </div>
    );
}
