// frontend/src/app/dashboard/page.tsx
'use client';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { uploadsAtom, UploadJob } from '../../atoms/uploads';
import Uploader from '@/components/ui/Uploader';
import UploadCard from '@/components/ui/UploadCard';
import { io, Socket } from 'socket.io-client';
import { makeThumbnailUrl } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DashboardPage() {
  const [uploads, setUploads] = useAtom(uploadsAtom);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let socket: Socket | null = null;
    try {
      socket = io(API_URL, {
        path: '/socket.io',
        auth: { token },
      });

      socket.on('thumbnail:job:update', (payload: UploadJob) => {
        // Normalize the incoming payload so the client atom never stores filesystem paths.
        // Prefer payload.thumbnailUrl, otherwise fallback to payload.thumbnailPath.
        // makeThumbnailUrl will resolve a relative '/uploads/...' into an absolute http URL.
        const rawThumb = (payload as any).thumbnailUrl ?? (payload as any).thumbnailPath ?? null;
        const resolved = makeThumbnailUrl(rawThumb ?? null, (payload as any).thumbnailPath ?? null);

        const normalized: UploadJob = {
          ...payload,
          // keep only the resolved safe URL (absolute or null). Avoid storing thumbnailPath on client atom.
          thumbnailUrl: resolved ?? null,
          // ensure we don't keep the fs path on the client-side atom
          // (cast to undefined to match type and explicitly remove it)
          thumbnailPath: undefined as unknown as string | undefined,
        };

        setUploads((prev) => {
          const idx = prev.findIndex((j) => j.jobId === normalized.jobId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...normalized };
            return updated;
          } else {
            return [...prev, normalized];
          }
        });
      });

      socket.on('connect_error', (err) => {
        console.error('Socket.io connect error:', err);
      });
    } catch (err) {
      console.error('Socket.io error:', err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [setUploads]);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <Uploader />
      <div className="space-y-4">
        {uploads.filter(Boolean).map((job) => (
          <UploadCard key={job.jobId} item={job} />
        ))}
      </div>
    </div>
  );
}