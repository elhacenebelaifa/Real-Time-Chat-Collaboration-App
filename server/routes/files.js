const router = require('express').Router();
const path = require('path');
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const fileService = require('../services/fileService');
const { compressImage, compressVideo } = require('../services/mediaCompressor');

async function buildVariants(file) {
  if (file.mimetype.startsWith('image/')) {
    try {
      const variants = await compressImage(file.path, file.mimetype);
      const status = variants.length ? 'success' : 'none';
      return { variants, compressionStatus: status };
    } catch (err) {
      console.error('image compression failed:', err);
      return { variants: [], compressionStatus: 'failed' };
    }
  }
  if (file.mimetype.startsWith('video/')) {
    try {
      const variants = await compressVideo(file.path);
      const expected = 3;
      let status = 'failed';
      if (variants.length === expected) status = 'success';
      else if (variants.length > 0) status = 'partial';
      return { variants, compressionStatus: status };
    } catch (err) {
      console.error('video compression failed:', err);
      return { variants: [], compressionStatus: 'failed' };
    }
  }
  return { variants: [], compressionStatus: 'none' };
}

// POST /api/files/upload
router.post('/upload', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }

    const { variants, compressionStatus } = await buildVariants(req.file);

    const fileMeta = await fileService.saveMetadata({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      roomId: req.body.roomId || null,
      variants,
      compressionStatus,
    });

    const baseUrl = `/api/files/${fileMeta._id}`;
    res.status(201).json({
      fileId: fileMeta._id,
      url: baseUrl,
      originalName: fileMeta.originalName,
      size: fileMeta.size,
      mimeType: fileMeta.mimeType,
      compressionStatus: fileMeta.compressionStatus,
      variants: fileMeta.variants.map((v) => ({
        kind: v.kind,
        label: v.label,
        mimeType: v.mimeType,
        size: v.size,
        width: v.width,
        height: v.height,
        url: `${baseUrl}?variant=${v.label}`,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/files/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const file = await fileService.getById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }
    const picked = fileService.pickVariant(file, req.query.variant);
    res.type(picked.mimeType);
    res.sendFile(path.resolve(picked.path));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
