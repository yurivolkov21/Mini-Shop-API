import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';
import { initFirebase, connectDB } from './lib';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import deviceRoutes from './routes/devices';
import imageRoutes from './routes/images';

// init Firebase Admin (đọc serviceAccountKey.json)
initFirebase();

// cấu hình Cloudinary từ .env (secret chỉ ở server)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'minishop-backend' });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/devices', deviceRoutes);
app.use('/images', imageRoutes);

const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/minishop';

connectDB(mongoUri)
  .then(() => {
    app.listen(port, () => console.log('Server chạy ở cổng ' + port));
  })
  .catch((e: Error) => {
    console.error('Không kết nối được MongoDB:', e.message);
    process.exit(1);
  });
