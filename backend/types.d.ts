import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    parts: () => AsyncIterableIterator<{
      type: 'file' | 'field';
      fieldname: string;
      filename: string;
      encoding: string;
      mimetype: string;
      file: NodeJS.ReadableStream;
    }>;
  }
}
