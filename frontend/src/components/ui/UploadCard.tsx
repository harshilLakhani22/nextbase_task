// frontend/src/components/ui/UploadCard.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { makeThumbnailUrl } from '../../lib/utils';

type UploadItem = {
  jobId: string;
  filename: string;
  status: string;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
} | null | undefined;

function sanitizeUrl(url?: string | null) {
  if (!url) return null;
  const s = url.trim();
  if (s.includes('/Users/') || s.startsWith('file:') || /^[A-Za-z]:\\/.test(s)) return null;
  return s;
}

const PLACEHOLDER_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="12">thumbnail</text></svg>'
  );

export default function UploadCard({ item }: { item?: UploadItem }) {
  if (!item) return null;

  const [imageUrl, setImageUrl] = useState<string | null>(() =>
    sanitizeUrl(makeThumbnailUrl(item.thumbnailUrl ?? null, item.thumbnailPath ?? null))
  );

  useEffect(() => {
    console.debug('[UploadCard] resolved imageUrl:', imageUrl, 'from', {
      thumbnailUrl: item.thumbnailUrl,
      thumbnailPath: item.thumbnailPath,
      status: item.status,
    });
  }, [imageUrl, item.thumbnailPath, item.thumbnailUrl, item.status]);

  useEffect(() => {
    const nextRaw = makeThumbnailUrl(item.thumbnailUrl ?? null, item.thumbnailPath ?? null);
    const next = sanitizeUrl(nextRaw);
    if (next !== imageUrl) setImageUrl(next);
  }, [item.thumbnailUrl, item.thumbnailPath]);

  return (
    <div className="rounded-2xl bg-[#18181b]/80 dark:bg-[#18181b]/80 border border-[#23272f]/60 shadow-lg p-5 flex items-center justify-between gap-4 transition-transform hover:scale-[1.025] hover:shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#23272f] to-[#101014] dark:from-[#23272f] dark:to-[#101014] rounded-xl flex items-center justify-center overflow-hidden border border-[#23272f]/60">
          {imageUrl && item.status === 'completed' ? (
            <img
              src={imageUrl}
              alt="thumbnail"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                console.error('[UploadCard] image failed to load:', imageUrl, e.currentTarget?.src);
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_DATA_URI;
              }}
            />
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">thumbnail</div>
          )}
        </div>
        <div>
          <div className="font-semibold text-base text-white break-all drop-shadow-sm">{item.filename}</div>
          <div>
            <span
              className={`inline-block px-2 py-1 mt-1 text-xs rounded-lg font-mono tracking-wide
                ${item.status === 'completed'
                  ? 'bg-green-900/80 text-green-200 border border-green-700'
                  : item.status === 'processing'
                  ? 'bg-yellow-900/80 text-yellow-200 border border-yellow-700'
                  : 'bg-gray-800/80 text-gray-300 border border-gray-700'}
              `}
            >
              {item.status}
            </span>
          </div>
        </div>
      </div>
      <div>
        {imageUrl && item.status === 'completed' ? (
          <a
            href={imageUrl}
            className="inline-block bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-1.5 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-400 transition-colors font-semibold"
            download
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        ) : (
          <button className="opacity-50 cursor-not-allowed inline-block bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold">
            Download
          </button>
        )}
      </div>
    </div>
  );
}