import { Router, Response } from 'express';
import { ProductModel } from '../models';
import { requireAuth, AuthedRequest } from '../lib';

const router = Router();

// Mọi route /products yêu cầu đăng nhập (Bearer app JWT)
router.use(requireAuth);

// GET /products  (?category=)
router.get('/', async (req: AuthedRequest, res: Response) => {
  try {
    const { category } = req.query as { category?: string };
    const filter = category ? { category } : {};
    const products = await ProductModel.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /products/:id
router.get('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /products
router.post('/', async (req: AuthedRequest, res: Response) => {
  try {
    const product = await ProductModel.create(req.body);
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// PUT /products/:id
router.put('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.json(product);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// DELETE /products/:id
router.delete('/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
