import Redis from 'ioredis';

const LOCK_PREFIX = 'lock:user:';
const LOCK_TTL = 30000; // 30s default TTL

/**
 * Acquire a per-user lock
 * @param redis Redis client
 * @param userId ID of the user
 * @param ttl lock time in ms
 * @returns lockValue if acquired, null otherwise
 */
export async function acquireLock(
  redis: Redis,
  userId: string,
  ttl = LOCK_TTL
): Promise<string | null> {
  const lockKey = `${LOCK_PREFIX}${userId}`;
  const lockValue = Math.random().toString(36).slice(2);

  // Correct syntax for ioredis
  const result = await redis.set(lockKey, lockValue, 'PX', ttl, 'NX');

  return result === 'OK' ? lockValue : null;
}

/**
 * Release a per-user lock using Lua script (safe release)
 * @param redis Redis client
 * @param userId ID of the user
 * @param lockValue value of the lock
 */
export async function releaseLock(
  redis: Redis,
  userId: string,
  lockValue: string
) {
  const lockKey = `${LOCK_PREFIX}${userId}`;
  const lua = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(lua, 1, lockKey, lockValue);
}
