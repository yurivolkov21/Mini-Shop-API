import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import 'dotenv/config';

// cấu hình Cloudinary từ .env (secret chỉ ở đây, KHÔNG để trong app Flutter)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors());
app.use(express.json());

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

// 1) UPLOAD: field form-data tên 'image'
app.post('/images', upload.single('image'), async (req: Request, res: Response) => {
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

// 2) LIST: mọi ảnh trong folder minishop/
app.get('/images', async (_req: Request, res: Response) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'minishop/',
      max_results: 100,
    });
    const images = (result.resources as Array<{ secure_url: string; public_id: string }>).map(
      (r) => ({ url: r.secure_url, publicId: r.public_id }),
    );
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 3) DELETE: /images?publicId=minishop/xxxxx
app.delete('/images', async (req: Request, res: Response) => {
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server chạy ở cổng ' + port));
