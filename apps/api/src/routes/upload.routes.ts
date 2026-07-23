import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@stylehub/types';

const router = Router();

// ─── Multer config — store files in /tmp/uploads ──────────────────────────────
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * POST /api/upload/image
 * Upload a single image file. Returns { url } pointing to the saved file.
 * In production, this should be replaced with Cloudinary upload.
 * For now, serves from the local filesystem.
 */
router.post('/image',
  protect,
  authorize(UserRole.Admin, UserRole.Vendor),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded.' });
        return;
      }

      // Try Cloudinary upload if credentials are available
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey    = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (cloudName && apiKey && apiSecret) {
        // Dynamic import to avoid hard dependency
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const cloudinary = require('cloudinary') as any;
          cloudinary.v2.config({
            cloud_name: cloudName,
            api_key:    apiKey,
            api_secret: apiSecret,
          });

          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'stylehub',
            resource_type: 'image',
          });

          // Clean up local file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            data: { url: result.secure_url },
          });
          return;
        } catch (cloudErr) {
          console.warn('[Upload] Cloudinary upload failed, falling back to local storage:', cloudErr);
        }
      }

      // Fallback: serve from local filesystem
      const url = `/api/upload/files/${req.file.filename}`;
      res.json({
        success: true,
        data: { url },
      });
    } catch (err) {
      console.error('[Upload Error]', err);
      res.status(500).json({ success: false, message: 'Failed to upload image.' });
    }
  },
);

/**
 * GET /api/upload/files/:filename
 * Serve uploaded files from local storage (dev fallback).
 */
router.get('/files/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  if (!filename) {
    res.status(400).json({ success: false, message: 'Filename required.' });
    return;
  }
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found.' });
  }
});

export default router;
