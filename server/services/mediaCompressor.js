const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const IMAGE_WIDTHS = [320, 640, 1280, 1920];

const VIDEO_PROFILES = [
  { label: 'low', maxHeight: 480, crf: 28, audioBitrate: '96k' },
  { label: 'high', maxHeight: 720, crf: 24, audioBitrate: '128k' },
];

function deriveSibling(srcPath, suffix, ext) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  return path.join(dir, `${base}.${suffix}.${ext}`);
}

async function compressImage(srcPath, mimeType) {
  if (mimeType === 'image/gif') return [];

  const variants = [];
  let meta;
  try {
    meta = await sharp(srcPath).metadata();
  } catch (err) {
    console.error('sharp metadata failed:', err);
    return [];
  }

  if (meta.pages && meta.pages > 1) return [];

  const sourceWidth = meta.width || 0;
  const targets = IMAGE_WIDTHS.filter((w) => w < sourceWidth);
  if (!targets.length) return [];

  for (const width of targets) {
    const outPath = deriveSibling(srcPath, `w${width}`, 'webp');
    try {
      const info = await sharp(srcPath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);
      variants.push({
        kind: 'image',
        label: `w${width}`,
        path: outPath,
        size: info.size,
        mimeType: 'image/webp',
        width: info.width,
        height: info.height,
      });
    } catch (err) {
      console.error(`sharp resize w${width} failed:`, err);
    }
  }
  return variants;
}

function encodeVideoVariant(srcPath, profile) {
  const outPath = deriveSibling(srcPath, profile.label, 'mp4');
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate(profile.audioBitrate)
      .outputOptions([
        `-crf ${profile.crf}`,
        '-preset veryfast',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        `-vf scale='min(iw,trunc(oh*a/2)*2)':'min(ih,${profile.maxHeight})':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,
      ])
      .on('end', () => resolve(outPath))
      .on('error', reject)
      .save(outPath);
  });
}

function extractPoster(srcPath) {
  const outPath = deriveSibling(srcPath, 'poster', 'jpg');
  return new Promise((resolve, reject) => {
    ffmpeg(srcPath)
      .seekInput(1)
      .frames(1)
      .outputOptions(['-q:v 4'])
      .on('end', () => resolve(outPath))
      .on('error', reject)
      .save(outPath);
  });
}

async function compressVideo(srcPath) {
  const variants = [];
  const tasks = [
    extractPoster(srcPath).then((outPath) => {
      const stat = fs.statSync(outPath);
      return {
        kind: 'poster',
        label: 'poster',
        path: outPath,
        size: stat.size,
        mimeType: 'image/jpeg',
      };
    }),
    ...VIDEO_PROFILES.map((profile) =>
      encodeVideoVariant(srcPath, profile).then((outPath) => {
        const stat = fs.statSync(outPath);
        return {
          kind: 'video',
          label: profile.label,
          path: outPath,
          size: stat.size,
          mimeType: 'video/mp4',
          height: profile.maxHeight,
        };
      })
    ),
  ];

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === 'fulfilled') variants.push(r.value);
    else console.error('video variant failed:', r.reason && r.reason.message);
  }

  return variants;
}

module.exports = {
  compressImage,
  compressVideo,
  IMAGE_WIDTHS,
  VIDEO_PROFILES,
};
