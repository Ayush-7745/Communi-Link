import { api } from '../services/api';

export async function migrateGeohashes() {
  return api.rebuildGeohashes();
}
