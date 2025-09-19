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
    // 1) Fetch existing uploads on mount
    async function fetchUploads() {
      try {
        const res = await fetch(`${API_URL}/api/uploads`, {
          method: 'GET',
          credentials: 'include', // send cookie
        });
        if (res.ok) {
          const data = await res.json();
          // Normalize thumbnail URLs using makeThumbnailUrl if needed
          const normalized = (data as any[]).map((j) => ({
            jobId: j.jobId,
            filename: j.filename,
            status: j.status,
            thumbnailUrl: makeThumbnailUrl(j.thumbnailUrl ?? null, undefined) ?? undefined,
            createdAt: j.createdAt,
          })) as UploadJob[];
          setUploads(normalized);
        } else {
          console.error('Failed to fetch uploads:', res.status);
        }
      } catch (err) {
        console.error('Error fetching uploads:', err);
      }
    }

    fetchUploads();

    // 2) Setup socket for real-time updates
    let socket: Socket | null = null;
    try {
      socket = io(API_URL, {
        path: '/socket.io',
        withCredentials: true,
      });

      socket.on('thumbnail:job:update', (payload: UploadJob) => {
        const rawThumb = (payload as any).thumbnailUrl ?? (payload as any).thumbnailPath ?? undefined;
        const resolved = makeThumbnailUrl(rawThumb ?? undefined, (payload as any).thumbnailPath ?? undefined);

        const normalized: UploadJob = {
          ...payload,
          thumbnailUrl: resolved ?? undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#101014] dark:bg-gradient-to-br dark:from-[#18181b] dark:via-[#23272f] dark:to-[#101014] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex flex-col items-center gap-2 pb-2">
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage your uploads and see their status in real time.</p>
        </header>
        <div className="rounded-2xl shadow-xl bg-[#23272f]/80 dark:bg-[#23272f]/80 p-6 backdrop-blur-md border border-[#23272f]/40">
          <Uploader />
        </div>
        <div className="flex flex-col gap-6">
          {uploads.filter(Boolean).map((job) => (
            <UploadCard key={job.jobId} item={job} />
          ))}
        </div>
      </div>
    </div>
  );
}