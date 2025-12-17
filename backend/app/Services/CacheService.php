<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class CacheService
{
    /**
     * Cache TTL constants (in seconds)
     */
    const CACHE_SHORT = 300;      // 5 minutes
    const CACHE_MEDIUM = 1800;    // 30 minutes
    const CACHE_LONG = 3600;      // 1 hour
    const CACHE_DAY = 86400;      // 24 hours
    const CACHE_WEEK = 604800;    // 7 days

    /**
     * Get cache key with prefix
     */
    protected function getKey(string $key): string
    {
        return config('cache.prefix', 'plan') . ':' . $key;
    }

    /**
     * Get cached data or execute callback and cache result
     */
    public function remember(string $key, int $ttl, callable $callback)
    {
        $cacheKey = $this->getKey($key);

        try {
            return Cache::remember($cacheKey, $ttl, $callback);
        } catch (\Exception $e) {
            Log::warning("Cache remember failed for key: {$key}", [
                'error' => $e->getMessage()
            ]);
            return $callback();
        }
    }

    /**
     * Get cached data
     */
    public function get(string $key, $default = null)
    {
        $cacheKey = $this->getKey($key);

        try {
            return Cache::get($cacheKey, $default);
        } catch (\Exception $e) {
            Log::warning("Cache get failed for key: {$key}", [
                'error' => $e->getMessage()
            ]);
            return $default;
        }
    }

    /**
     * Store data in cache
     */
    public function put(string $key, $value, int $ttl = 3600): bool
    {
        $cacheKey = $this->getKey($key);

        try {
            return Cache::put($cacheKey, $value, $ttl);
        } catch (\Exception $e) {
            Log::warning("Cache put failed for key: {$key}", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Forget cached data
     */
    public function forget(string $key): bool
    {
        $cacheKey = $this->getKey($key);

        try {
            return Cache::forget($cacheKey);
        } catch (\Exception $e) {
            Log::warning("Cache forget failed for key: {$key}", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Clear cache by pattern (Redis only)
     */
    public function clearPattern(string $pattern): int
    {
        if (config('cache.default') !== 'redis') {
            return 0;
        }

        try {
            $pattern = $this->getKey($pattern);
            $keys = Redis::keys($pattern);

            if (empty($keys)) {
                return 0;
            }

            return Redis::del($keys);
        } catch (\Exception $e) {
            Log::warning("Cache clearPattern failed for pattern: {$pattern}", [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Cache user-specific data
     */
    public function rememberUser(string $key, int $userId, int $ttl, callable $callback)
    {
        return $this->remember("user:{$userId}:{$key}", $ttl, $callback);
    }

    /**
     * Clear user-specific cache
     */
    public function clearUserCache(int $userId, string $pattern = '*'): int
    {
        return $this->clearPattern("user:{$userId}:{$pattern}");
    }

    /**
     * Cache query results
     */
    public function rememberQuery(string $key, int $ttl, callable $callback)
    {
        return $this->remember("query:{$key}", $ttl, $callback);
    }

    /**
     * Clear query cache
     */
    public function clearQueryCache(string $pattern = '*'): int
    {
        return $this->clearPattern("query:{$pattern}");
    }

    /**
     * Cache dashboard data
     */
    public function rememberDashboard(int $userId, int $ttl, callable $callback)
    {
        return $this->remember("dashboard:{$userId}", $ttl, $callback);
    }

    /**
     * Clear dashboard cache
     */
    public function clearDashboardCache(int $userId): bool
    {
        return $this->forget("dashboard:{$userId}");
    }

    /**
     * Cache course data
     */
    public function rememberCourse(int $courseId, string $key, int $ttl, callable $callback)
    {
        return $this->remember("course:{$courseId}:{$key}", $ttl, $callback);
    }

    /**
     * Clear course cache
     */
    public function clearCourseCache(int $courseId): int
    {
        return $this->clearPattern("course:{$courseId}:*");
    }

    /**
     * Cache project data
     */
    public function rememberProject(int $projectId, string $key, int $ttl, callable $callback)
    {
        return $this->remember("project:{$projectId}:{$key}", $ttl, $callback);
    }

    /**
     * Clear project cache
     */
    public function clearProjectCache(int $projectId): int
    {
        return $this->clearPattern("project:{$projectId}:*");
    }

    /**
     * Cache team data
     */
    public function rememberTeam(int $teamId, string $key, int $ttl, callable $callback)
    {
        return $this->remember("team:{$teamId}:{$key}", $ttl, $callback);
    }

    /**
     * Clear team cache
     */
    public function clearTeamCache(int $teamId): int
    {
        return $this->clearPattern("team:{$teamId}:*");
    }

    /**
     * Check if Redis is available
     */
    public function isRedisAvailable(): bool
    {
        try {
            if (config('cache.default') !== 'redis') {
                return false;
            }
            Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Flush all cache (use with caution!)
     */
    public function flushAll(): bool
    {
        try {
            return Cache::flush();
        } catch (\Exception $e) {
            Log::error("Cache flush failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cache statistics (Redis only)
     */
    public function getStats(): array
    {
        if (!$this->isRedisAvailable()) {
            return [
                'enabled' => false,
                'driver' => config('cache.default')
            ];
        }

        try {
            $info = Redis::info();
            return [
                'enabled' => true,
                'driver' => 'redis',
                'used_memory' => $info['used_memory_human'] ?? 'N/A',
                'connected_clients' => $info['connected_clients'] ?? 0,
                'total_keys' => Redis::dbSize() ?? 0,
            ];
        } catch (\Exception $e) {
            return [
                'enabled' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}

