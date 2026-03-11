import { kv } from '../../storage/mmkv';

export const supabaseAuthStorage = {
  async getItem(key: string) {
    return kv.getString(key) ?? null;
  },
  async setItem(key: string, value: string) {
    kv.set(key, value);
  },
  async removeItem(key: string) {
    kv.remove(key);
  },
};
