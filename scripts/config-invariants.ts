type CatalogMetadata = { championId: string; iconUrl?: string; wikiUrl?: string; difficultyNote?: string };
type CatalogProfile = { championId: string; lane: string; iconUrl?: string; wikiUrl?: string };

export interface ConfigInvariantBundle {
  championCatalog: { metadata: CatalogMetadata[]; profiles: CatalogProfile[] };
}

export interface ManifestVersionBundle {
  testDefinitionVersion?: string;
  championProfileVersion?: string;
  recommendationConfigVersion?: string;
  files?: string[];
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

export function assertManifestConsistency(manifest: ManifestVersionBundle, documents: Record<string, { schemaVersion?: string }>): string[] {
  const errors: string[] = [];
  const expectedVersions: Record<string, string | undefined> = {
    'test_definitions.json': manifest.testDefinitionVersion,
    'champion_catalog.json': manifest.championProfileVersion,
    'recommendation_categories.json': manifest.recommendationConfigVersion,
  };
  for (const [fileName, expected] of Object.entries(expectedVersions)) {
    if (!manifest.files?.includes(fileName)) errors.push(`manifest missing file: ${fileName}`);
    const actual = documents[fileName]?.schemaVersion;
    if (expected && actual && expected !== actual) errors.push(`version mismatch: ${fileName} expected ${expected} but found ${actual}`);
  }
  return errors;
}
