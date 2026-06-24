import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const router = Router();

// file nằm trong RAM, giới hạn 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// helper: stream 1 buffer ảnh lên Cloudinary -> trả về result
function uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'minishop', resource_type: 'image' },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Upload thất bại'));
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

// POST /images  (field form-data 'image')
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Thiếu file image' });
      return;
    }
    const result = await uploadBuffer(req.file.buffer);
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /images  (mọi ảnh trong folder minishop/)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'minishop/',
      max_results: 100,
    });
    const images = (
      result.resources as Array<{ secure_url: string; public_id: string }>
    ).map((r) => ({ url: r.secure_url, publicId: r.public_id }));
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// DELETE /images?publicId=minishop/xxxxx
router.delete('/', async (req: Request, res: Response) => {
  try {
    const publicId = req.query.publicId as string | undefined;
    if (!publicId) {
      res.status(400).json({ error: 'Thiếu publicId' });
      return;
    }
    await cloudinary.uploader.destroy(publicId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
