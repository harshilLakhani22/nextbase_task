// frontend/src/lib/socket.ts
import { io } from 'socket.io-client';
import { makeThumbnailUrl } from './utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function createSocket(token?: string | null) {
  const socket = io(API_URL, {
    path: '/socket.io',
    auth: {
      token,
    },
  });

  socket.on('connect', () => {
    console.log('socket connected', socket.id);
  });

  // example event name from backend: 'thumbnail:job:update' or channel -> adapt as needed
  socket.on('thumbnail:job:update', (payload: any) => {
    // payload may contain thumbnailPath (fs) or thumbnailUrl
    const thumbnailUrl = makeThumbnailUrl(payload.thumbnailUrl || null, payload.thumbnailPath || null);
    const normalized = { ...payload, thumbnailUrl };
    window.dispatchEvent(new CustomEvent('thumbnail:update', { detail: normalized }));
  });

  return socket;
}