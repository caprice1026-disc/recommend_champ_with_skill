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
    profiles = load_config('champion_base_profiles.json')['profiles']
    if len({profile['championId'] for profile in profiles}) < 9:
        raise ValueError('champion_base_profiles.json must contain at least 9 unique champions')
    return profiles


def load_champion_lanes() -> list[dict[str, Any]]:
    profiles = load_config('champion_lane_profiles.json')['profiles']
    if len({(profile['championId'], profile['lane']) for profile in profiles}) < 9:
        raise ValueError('champion_lane_profiles.json must contain at least 9 unique champion-lane profiles')
    return profiles


def load_all_config() -> dict[str, Any]:
    manifest = load_manifest()
    return {
        'manifest': manifest,
        'champions': load_champions(),
        'championLanes': load_champion_lanes(),
        'tests': load_config('test_definitions.json'),
        'categories': load_config('recommendation_categories.json'),
    }
