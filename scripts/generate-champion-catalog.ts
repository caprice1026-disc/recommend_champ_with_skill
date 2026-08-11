import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve('data/config/v1/champion_catalog.json');
const outputPath = resolve('src/client/data/generatedChampionCatalog.ts');

const source = JSON.parse(await readFile(sourcePath, 'utf8')) as { metadata: Array<Record<string, unknown>>; profiles: Array<Record<string, unknown>> };
const laneSource = JSON.parse(await readFile(resolve('data/config/v1/champion_lane_profiles.json'), 'utf8')) as { profiles: Array<Record<string, unknown>> };
const metadataById = new Map(source.metadata.map((entry) => [entry.championId, entry]));
const merged: Array<Record<string, unknown>> = [...laneSource.profiles, ...source.profiles].map((profile): Record<string, unknown> => {
  const metadata = metadataById.get(profile.championId as string) ?? {};
  return { ...profile, iconUrl: profile.iconUrl ?? metadata.iconUrl, wikiUrl: profile.wikiUrl ?? metadata.wikiUrl, difficultyNote: profile.difficultyNote ?? metadata.difficultyNote };
});
const seen = new Set<string>();
const profiles = merged.filter((profile) => {
  const key = `${String(profile.championId)}/${String(profile.lane)}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
const output = `import type { ChampionLaneProfile } from '../../domain/types';\n\nexport const GENERATED_CHAMPION_LANES: ChampionLaneProfile[] = ${JSON.stringify(profiles, null, 2)};\n\nexport const CHAMPION_METADATA = ${JSON.stringify(source.metadata, null, 2)} as const;\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8');
  if (current !== output) {
    console.error('Generated champion catalog is out of date. Run npm run catalog:generate.');
    process.exitCode = 1;
  } else {
    console.log('Generated champion catalog is up to date.');
  }
} else {
  await writeFile(outputPath, output, 'utf8');
  console.log(`Generated ${outputPath}`);
}
