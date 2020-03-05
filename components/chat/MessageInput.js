import { useState, useRef } from 'react';
import { api } from '../../lib/api';
import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

const EMOJI_SET = ['😀', '😂', '😍', '😎', '🤔', '👍', '👎', '🙌', '👏', '🙏', '💯', '🔥', '✨', '🎉', '❤️', '💙', '🚀', '✅', '⚠️', '📌', '👀', '😅', '😭', '🤝'];

export default function MessageInput({ onSend, onTyping, roomId, disabled, placeholder = 'Message…' }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const insertAtCursor = (snippet) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${snippet}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const wrapSelection = (left, right = left) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const middle = text.slice(start, end);
    const after = text.slice(end);
    const next = `${before}${left}${middle}${right}${after}`;
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + left.length + middle.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !file) return;

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);
        const uploadResult = await api.upload('/files/upload', formData);
        onSend(trimmed, 'file', {
          fileId: uploadResult.fileId,
          fileName: uploadResult.originalName,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimeType,
          url: uploadResult.url,
          variants: uploadResult.variants || [],
        });
      } catch (err) {
        console.error('File upload failed:', err);
      } finally {
        setUploading(false);
        setFile(null);
      }
    } else {
      onSend(trimmed, 'text');
    }
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (!!text.trim() || !!file) && !disabled && !uploading;

  return (
    <div className={styles.composerArea}>
      {file && (
        <div className={styles.filePreview}>
          <Icon name="file" color="#64748b" />
          <span className={styles.filePreviewName}>{file.name}</span>
          <span className={styles.filePreviewSize}>({(file.size / 1024).toFixed(1)} KB)</span>
          <button
            type="button"
            className={styles.filePreviewRemove}
            onClick={() => setFile(null)}
            title="Remove attachment"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      )}

      <form className={styles.composerCard} onSubmit={handleSubmit}>
        <div className={styles.composerToolbar}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              const sel = e.target.files?.[0];
              if (sel) setFile(sel);
            }}
          />
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Attach"
          >
            <Icon name="paperclip" size={15} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            title="Mention"
            onClick={() => insertAtCursor('@')}
          >
            <Icon name="at" size={15} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.toolBtn}
              title="Emoji"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              <Icon name="smile" size={15} />
            </button>
            {emojiOpen && (
              <div className={styles.emojiPicker}>
                {EMOJI_SET.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={styles.emojiPickerBtn}
                    onClick={() => {
                      insertAtCursor(e);
                      setEmojiOpen(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className={styles.toolBtn} title="Voice"><Icon name="mic" size={15} /></button>
          <div className={styles.toolDivider} />
          <button type="button" className={styles.toolBtn} title="Bold" onClick={() => wrapSelection('**')}><span style={{ fontWeight: 700, fontSize: 12 }}>B</span></button>
          <button type="button" className={styles.toolBtn} title="Italic" onClick={() => wrapSelection('*')}><span style={{ fontStyle: 'italic', fontSize: 12 }}>I</span></button>
          <button type="button" className={styles.toolBtn} title="Code" onClick={() => wrapSelection('`')}><span className={styles.mono} style={{ fontSize: 11 }}>{'</>'}</span></button>
          <div style={{ flex: 1 }} />
          <span className={`${styles.kbdHint} ${styles.mono}`}>
            <kbd className={styles.kbd}>↵</kbd> send · <kbd className={styles.kbd}>⇧↵</kbd> newline
          </span>
        </div>

        <textarea
          ref={textareaRef}
          className={styles.composerTextarea}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (onTyping) onTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={disabled || uploading}
        />

        <div className={styles.composerActions}>
          <button
            type="submit"
            className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ''}`}
            disabled={!canSend}
            title="Send"
          >
            {uploading ? 'Sending…' : (<>Send <Icon name="send" size={13} color={canSend ? '#fff' : '#64748b'} /></>)}
          </button>
        </div>
      </form>
    </div>
  );
}
