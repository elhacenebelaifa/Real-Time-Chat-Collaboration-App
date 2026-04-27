const fileAttachmentRepository = require('../repositories/fileAttachmentRepository');

function defaultLabelFor(mimeType) {
    if (mimeType.startsWith('image/')) return 'w1280';
    if (mimeType.startsWith('video/')) return 'high';
    return 'original';
}

const fileService = {
    saveMetadata(data) {
        return fileAttachmentRepository.create({
            originalName: data.originalName,
            storedName: data.storedName,
            mimeType: data.mimeType,
            size: data.size,
            path: data.path,
            uploadedBy: data.uploadedBy,
            roomId: data.roomId,
            variants: data.variants || [],
            compressionStatus: data.compressionStatus || 'none',
        });
    },

    getById(fileId) {
        return fileAttachmentRepository.findById(fileId);
    },

    pickVariant(file, requestedLabel) {
        if (requestedLabel === 'original') {
            return { path: file.path, mimeType: file.mimeType };
        }
        const variants = file.variants || [];
        if (requestedLabel) {
            const match = variants.find((v) => v.label === requestedLabel);
            if (match) return { path: match.path, mimeType: match.mimeType };
        }
        const fallbackLabel = defaultLabelFor(file.mimeType);
        const fallback = variants.find((v) => v.label === fallbackLabel);
        if (fallback) return { path: fallback.path, mimeType: fallback.mimeType };

        if (file.mimeType.startsWith('image/')) {
            const widest = [...variants]
                .filter((v) => v.kind === 'image')
                .sort((a, b) => (b.width || 0) - (a.width || 0))[0];
            if (widest) return { path: widest.path, mimeType: widest.mimeType };
        }
        return { path: file.path, mimeType: file.mimeType };
    },
};

module.exports = fileService;
