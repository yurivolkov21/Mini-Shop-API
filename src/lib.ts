import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// ---- Firebase Admin (modular API v14) ----
export function initFirebase(): void {
  // Render/production: đọc service account từ env var FIREBASE_SERVICE_ACCOUNT (JSON string).
  // Local dev: fallback đọc file serviceAccountKey.json (đã gitignore — secret thật).
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccount = fromEnv
    ? JSON.parse(fromEnv)
    : JSON.parse(
        readFileSync(resolve(process.cwd(), 'serviceAccountKey.json'), 'utf-8'),
      );
  initializeApp({ credential: cert(serviceAccount) });
}

export const verifyFirebaseIdToken = (idToken: string) =>
  getAuth().verifyIdToken(idToken);

// ---- MongoDB ----
export async function connectDB(uri: string): Promise<void> {
  await mongoose.connect(uri);
  console.log('MongoDB đã kết nối');
}

// ---- App JWT ----
export function signAppJwt(payload: { userId: string; uid: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// ---- Auth middleware: verify Bearer app JWT ----
export interface AuthedRequest extends Request {
  userId?: string;
  uid?: string;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Thiếu hoặc sai Authorization header' });
    return;
  }
  try {
    const payload = jwt.verify(header.substring(7), JWT_SECRET) as {
      userId: string;
      uid: string;
    };
    req.userId = payload.userId;
    req.uid = payload.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' });
  }
}
