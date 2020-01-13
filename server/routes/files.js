const router = require('express').Router();
const path = require('path');
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const fileService = require('../services/fileService');

// POST /api/files/upload
router.post('/upload', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }

    const fileMeta = await fileService.saveMetadata({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      roomId: req.body.roomId || null,
    });

    res.status(201).json({
      fileId: fileMeta._id,
      url: `/api/files/${fileMeta._id}`,
      originalName: fileMeta.originalName,
      size: fileMeta.size,
      mimeType: fileMeta.mimeType,
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
    res.sendFile(path.resolve(file.path));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
