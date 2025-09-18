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
    <div className="bg-white rounded shadow p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
          {imageUrl && item.status === 'completed' ? (
            <img
              src={imageUrl}
              alt="thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('[UploadCard] image failed to load:', imageUrl, e.currentTarget?.src);
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_DATA_URI;
              }}
            />
          ) : (
            <div className="text-xs text-gray-500">thumbnail</div>
          )}
        </div>

        <div>
          <div className="font-medium text-sm break-all">{item.filename}</div>
          <div>
            <span
              className={`inline-block px-2 py-1 mt-1 text-xs rounded ${
                item.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : item.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
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
            className="inline-block bg-blue-600 text-white px-3 py-1 rounded"
            download
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        ) : (
          <button className="opacity-50 cursor-not-allowed inline-block bg-blue-600 text-white px-3 py-1 rounded">
            Download
          </button>
        )}
      </div>
    </div>
  );
}