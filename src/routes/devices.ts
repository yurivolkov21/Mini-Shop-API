import { Router, Request, Response } from 'express';
import { DeviceModel } from '../models';

const router = Router();

// POST /devices  { fcmToken }  -> lưu/cập nhật token thiết bị
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fcmToken } = req.body as { fcmToken?: string };
    if (!fcmToken) {
      res.status(400).json({ error: 'Thiếu fcmToken' });
      return;
    }
    const device = await DeviceModel.findOneAndUpdate(
      { fcmToken },
      { fcmToken },
      { upsert: true, new: true },
    );
    res.json({ ok: true, id: device?._id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
