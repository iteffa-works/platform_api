import { writable } from 'svelte/store';
import { fetchProfile, type CabinetProfile } from './api.js';

export const profile = writable<CabinetProfile | null>(null);

export async function loadProfile(): Promise<void> {
  profile.set(await fetchProfile());
}
