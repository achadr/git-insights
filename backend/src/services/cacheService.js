class CacheService {
  constructor() {
    this.cache = new Map();
    this.DEFAULT_TTL = 60 * 60 * 24; // 24 hours in seconds
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttl = this.DEFAULT_TTL) {
    const expiry = Date.now() + (ttl * 1000);

    this.cache.set(key, {
      value,
      expiry
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  exists(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  generateKey(type, identifier) {
    return `gitinsights:${type}:${identifier}`;
  }

  clear() {
    this.cache.clear();
  }
}

export default new CacheService();
