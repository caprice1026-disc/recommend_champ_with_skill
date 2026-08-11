import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { assertConfigInvariants } from './config-invariants';

const configDir = resolve('data/config/v1');
const schemaDir = resolve(configDir, 'schemas');
const configNames = [
  'manifest.json',
  'test_definitions.json',
  'champion_base_profiles.json',
  'champion_lane_profiles.json',
  'champion_catalog.json',
  'recommendation_categories.json',
] as const;

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function schemaName(configName: string): string {
  return `${configName.replace(/\.json$/, '')}.schema.json`;
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat('uri-reference', () => true);
const errors: string[] = [];
const documents = new Map<string, any>();

for (const name of configNames) {
  const document = await readJson(resolve(configDir, name));
  documents.set(name, document);
  const schema = await readJson(resolve(schemaDir, schemaName(name)));
  const validate = ajv.compile(schema as object);
  if (!validate(document)) {
    for (const issue of validate.errors ?? []) errors.push(`${name}${issue.instancePath || '$'} ${issue.message ?? 'invalid'}`);
  }
}

const catalog = documents.get('champion_catalog.json');
if (catalog) {
  const invariantErrors = assertConfigInvariants({ championCatalog: catalog });
  errors.push(...invariantErrors.map((issue) => `champion_catalog ${issue}`));
}

const lane = documents.get('champion_lane_profiles.json');
const catalogProfiles = catalog?.profiles ?? [];
if (lane) {
  const keys = new Set<string>();
  for (const profile of [...lane.profiles, ...catalogProfiles]) {
    const key = `${profile.championId}/${profile.lane}`;
    if (keys.has(key)) errors.push(`champion-lane duplicate: ${key}`);
    keys.add(key);
  }
}

if (errors.length > 0) {
  console.error(errors.map((issue) => `- ${issue}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${configNames.length} configuration files and ${catalog?.profiles?.length ?? 0} catalog profiles.`);
}
