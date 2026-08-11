from __future__ import annotations

import json
import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / 'backend' / 'data' / 'config' / 'v1'
OUTPUT = ROOT / 'frontend' / 'src' / 'data' / 'generatedChampionCatalog.ts'


def read(name: str) -> dict:
    return json.loads((CONFIG_DIR / name).read_text(encoding='utf-8'))


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate the frontend champion catalog from backend config.')
    parser.add_argument('--check', action='store_true', help='Fail when the generated file is out of date.')
    args = parser.parse_args()
    existing = read('champion_lane_profiles.json')['profiles']
    catalog = read('champion_catalog.json')
    metadata = {item['championId']: item for item in catalog['metadata']}
    profiles: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for source in [existing, catalog['profiles']]:
        for profile in source:
            key = (profile['championId'], profile['lane'])
            if key in seen:
                continue
            enriched = dict(profile)
            source_metadata = metadata.get(profile['championId'], {})
            for field in ('iconUrl', 'wikiUrl', 'difficultyNote'):
                if field in source_metadata:
                    enriched.setdefault(field, source_metadata[field])
            profiles.append(enriched)
            seen.add(key)

    metadata_json = json.dumps(catalog['metadata'], ensure_ascii=False, indent=2)
    profiles_json = json.dumps(profiles, ensure_ascii=False, indent=2)
    generated = (
        "import type { ChampionLaneProfile } from '../domain/types';\n\n"
        f'export const GENERATED_CHAMPION_LANES: ChampionLaneProfile[] = {profiles_json};\n\n'
        f'export const CHAMPION_METADATA = {metadata_json} as const;\n'
    )
    if args.check:
        current = OUTPUT.read_text(encoding='utf-8') if OUTPUT.exists() else ''
        if current != generated:
            raise SystemExit(f'generated catalog is out of date: {OUTPUT}')
        return
    OUTPUT.write_text(generated, encoding='utf-8')


if __name__ == '__main__':
    main()
