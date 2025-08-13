import { kv } from './mmkv';
import { Dream } from '../types/dream';

const KEY = 'dreams';

export function listDreams(): Dream[] {
  const raw = kv.getString(KEY);
  return raw ? (JSON.parse(raw) as Dream[]) : [];
}

export function saveDream(d: Dream) {
  const all = listDreams();
  const idx = all.findIndex(x => x.id === d.id);
  if (idx >= 0) all[idx] = d; else all.unshift(d);
  kv.set(KEY, JSON.stringify(all));
}

export function getDream(id: string): Dream | undefined {
  return listDreams().find(x => x.id === id);
}