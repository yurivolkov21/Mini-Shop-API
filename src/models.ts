import { Schema, model } from 'mongoose';

// User: ánh xạ từ Firebase account
const userSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true }, // Firebase UID
    email: { type: String, required: true },
    name: String,
    photoUrl: String,
  },
  { timestamps: true },
);
export const UserModel = model('User', userSchema);

// Product: sản phẩm MiniShop
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: String, // secure_url từ Cloudinary
    description: String,
    category: { type: String, default: 'general' },
  },
  { timestamps: true },
);
export const ProductModel = model('Product', productSchema);

// Device: lưu FCM token để gửi push
const deviceSchema = new Schema(
  {
    fcmToken: { type: String, required: true, unique: true },
    uid: String, // user gắn token (optional)
  },
  { timestamps: true },
);
export const DeviceModel = model('Device', deviceSchema);
