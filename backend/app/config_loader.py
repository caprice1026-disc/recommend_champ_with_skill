from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


CONFIG_DIR = Path(__file__).resolve().parents[1] / 'data' / 'config' / 'v1'
SCHEMA_DIR = CONFIG_DIR / 'schemas'


def _schema_name(config_name: str) -> str:
    return f'{Path(config_name).stem}.schema.json'


def load_config(name: str) -> dict[str, Any]:
    path = CONFIG_DIR / name
    with path.open(encoding='utf-8') as handle:
        payload = json.load(handle)
    schema_path = SCHEMA_DIR / _schema_name(name)
    with schema_path.open(encoding='utf-8') as handle:
        schema = json.load(handle)
    errors = sorted(Draft202012Validator(schema).iter_errors(payload), key=lambda error: list(error.path))
    if errors:
        location = '.'.join(str(part) for part in errors[0].path) or '$'
        raise ValueError(f'Invalid config {name} at {location}: {errors[0].message}')
    return payload


def load_manifest() -> dict[str, Any]:
    return load_config('manifest.json')


def load_champions() -> list[dict[str, Any]]:
    base_profiles = load_config('champion_base_profiles.json')['profiles']
    catalog = load_config('champion_catalog.json')
    metadata = {profile['championId']: profile for profile in catalog['metadata']}
    profiles = [dict(profile) for profile in base_profiles]
    known_ids = {profile['championId'] for profile in profiles}
    for lane_profile in catalog['profiles']:
        if lane_profile['championId'] in known_ids:
            continue
        profiles.append({
            'championId': lane_profile['championId'],
            'championName': lane_profile['championName'],
            'styleProfile': lane_profile['styleProfile'],
            'strengthTags': lane_profile['strengthTags'],
            'riskTags': lane_profile['riskTags'],
            'trainingTags': lane_profile['trainingTags'],
        })
        known_ids.add(lane_profile['championId'])
    profiles = [_with_metadata(profile, metadata) for profile in profiles]
    if len({profile['championId'] for profile in profiles}) < 9:
        raise ValueError('champion_base_profiles.json must contain at least 9 unique champions')
    return profiles


def load_champion_lanes() -> list[dict[str, Any]]:
    existing_profiles = load_config('champion_lane_profiles.json')['profiles']
    catalog = load_config('champion_catalog.json')
    metadata = {profile['championId']: profile for profile in catalog['metadata']}
    profiles = [dict(profile) for profile in existing_profiles]
    known_keys = {(profile['championId'], profile['lane']) for profile in profiles}
    profiles.extend(
        dict(profile)
        for profile in catalog['profiles']
        if (profile['championId'], profile['lane']) not in known_keys
    )
    profiles = [_with_metadata(profile, metadata) for profile in profiles]
    if len({(profile['championId'], profile['lane']) for profile in profiles}) < 9:
        raise ValueError('champion_lane_profiles.json must contain at least 9 unique champion-lane profiles')
    return profiles


def _with_metadata(profile: dict[str, Any], metadata: dict[str, dict[str, Any]]) -> dict[str, Any]:
    enriched = dict(profile)
    source = metadata.get(profile['championId'], {})
    for key in ('iconUrl', 'wikiUrl', 'difficultyNote'):
        if key in source:
            enriched.setdefault(key, source[key])
    return enriched


def load_all_config() -> dict[str, Any]:
    manifest = load_manifest()
    return {
        'manifest': manifest,
        'champions': load_champions(),
        'championLanes': load_champion_lanes(),
        'tests': load_config('test_definitions.json'),
        'categories': load_config('recommendation_categories.json'),
    }
