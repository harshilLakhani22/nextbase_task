import { FastifyInstance } from 'fastify';
import { User } from '../models/user.js';
import bcrypt from 'bcrypt';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/signup', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };
    if (!username || !password) return reply.code(400).send({ error: 'Username and password required' });
    const existing = await User.findOne({ username });
    if (existing) return reply.code(409).send({ error: 'Username already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    const token = fastify.jwt.sign({ userId: user._id, username: user.username });
    reply.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return { success: true, user: { userId: user._id, username: user.username } };
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };
    if (!username || !password) return reply.code(400).send({ error: 'Username and password required' });
    const user = await User.findOne({ username });
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });
    const token = fastify.jwt.sign({ userId: user._id, username: user.username });
    reply.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return { success: true, user: { userId: user._id, username: user.username } };
  });
}
