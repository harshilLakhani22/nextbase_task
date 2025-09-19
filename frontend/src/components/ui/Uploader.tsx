'use client';
import { useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { uploadsAtom } from '../../atoms/uploads';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Uploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setUploads] = useAtom(uploadsAtom);
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: FileList) {
    setLoading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append('file', f));
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include', // Send cookies for auth
      });

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      if (res.ok && Array.isArray(data)) {
        setUploads(prev => [...data.map((j: any) => ({ ...j })), ...prev]);
      } else {
        console.error('Upload error:', { status: res.status, body: data });
        alert(`Upload failed: ${res.status} - ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error('Upload network error:', err);
      alert('Upload network error. See console for details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 border-2 border-dashed border-[#23272f]/60 rounded-2xl flex flex-col items-center bg-[#18181b]/80 dark:bg-[#18181b]/80 backdrop-blur-md shadow-lg">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
        accept="image/*,video/*"
      />
      <button
        className="mb-3 px-6 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-lg font-semibold shadow-md hover:from-blue-600 hover:to-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Select Files'}
      </button>
      <div
        className="w-full h-24 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-[#23272f]/60 rounded-xl mt-2 border border-[#23272f]/40"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
      >
        Drag & drop files here
      </div>
    </div>
  );
}