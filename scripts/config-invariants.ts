type CatalogMetadata = { championId: string; iconUrl?: string; wikiUrl?: string; difficultyNote?: string };
type CatalogProfile = { championId: string; lane: string; iconUrl?: string; wikiUrl?: string };

export interface ConfigInvariantBundle {
  championCatalog: { metadata: CatalogMetadata[]; profiles: CatalogProfile[] };
}

export function assertConfigInvariants(bundle: ConfigInvariantBundle): string[] {
  const errors: string[] = [];
  const metadata = new Map(bundle.championCatalog.metadata.map((entry) => [entry.championId, entry]));
  const keys = new Set<string>();
  for (const profile of bundle.championCatalog.profiles) {
    const key = `${profile.championId}/${profile.lane}`;
    if (keys.has(key)) errors.push(`duplicate champion-lane: ${key}`);
    keys.add(key);
    const entry = metadata.get(profile.championId);
    if (!entry?.iconUrl || !entry.wikiUrl || !entry.difficultyNote || !profile.iconUrl || !profile.wikiUrl) errors.push(`missing metadata: ${profile.championId}`);
  }
  return errors;
}
