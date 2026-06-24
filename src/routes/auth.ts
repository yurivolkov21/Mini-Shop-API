import { Router, Request, Response } from 'express';
import { verifyFirebaseIdToken, signAppJwt } from '../lib';
import { UserModel } from '../models';

const router = Router();

// POST /auth/google  { idToken } -> { token: <app_jwt> }
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ error: 'Thiếu idToken' });
      return;
    }
    // 1. verify Firebase idToken bằng Admin SDK
    const decoded = await verifyFirebaseIdToken(idToken);
    // 2. upsert user theo Firebase uid
    const user = await UserModel.findOneAndUpdate(
      { uid: decoded.uid },
      {
        uid: decoded.uid,
        email: decoded.email ?? '',
        name: decoded.name ?? '',
        photoUrl: decoded.picture ?? '',
      },
      { upsert: true, new: true },
    );
    if (!user) {
      res.status(500).json({ error: 'Không tạo được user' });
      return;
    }
    // 3. cấp app JWT riêng của backend
    const token = signAppJwt({ userId: user._id.toString(), uid: user.uid });
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: 'Xác thực thất bại: ' + (e as Error).message });
  }
});

export default router;
