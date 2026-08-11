import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from backend.app.config_loader import load_all_config, load_champion_lanes, load_champions


def test_versioned_config_is_schema_valid_and_complete() -> None:
    config = load_all_config()
    assert config['manifest']['schemaVersion'] == '1.0.0'
    assert len(config['champions']) >= 24
    assert len(config['championLanes']) >= 25
    assert all(profile.get('iconUrl') for profile in config['championLanes'])
    assert all(profile.get('wikiUrl') for profile in config['championLanes'])
    assert len(config['tests']['detailedAdditions']) == 8
    assert {category['id'] for category in config['categories']['categories']} == {
        'ready_now', 'growth_candidate', 'aspirational'
    }


def test_champion_lane_keys_are_unique() -> None:
    keys = {(profile['championId'], profile['lane']) for profile in load_champion_lanes()}
    assert len(keys) == len(load_champion_lanes())
    assert len({profile['championId'] for profile in load_champions()}) >= 9


def test_catalog_contains_representative_lanes() -> None:
    lanes = load_champion_lanes()
    assert {'TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'} <= {profile['lane'] for profile in lanes}
    assert {'aatrox', 'zed', 'vi', 'jinx', 'leona'} <= {profile['championId'] for profile in lanes}


def test_champion_schemas_reject_unknown_axes_and_missing_style_axes() -> None:
    schema_dir = Path('backend/data/config/v1/schemas')
    payload = json.loads(Path('backend/data/config/v1/champion_lane_profiles.json').read_text(encoding='utf-8'))
    schema = json.loads((schema_dir / 'champion_lane_profiles.schema.json').read_text(encoding='utf-8'))
    unknown = json.loads(json.dumps(payload))
    unknown['profiles'][0]['styleProfile']['clickAccurary'] = 0.5
    missing = json.loads(json.dumps(payload))
    del missing['profiles'][0]['styleProfile']['reaction']
    assert list(Draft202012Validator(schema).iter_errors(unknown))
    assert list(Draft202012Validator(schema).iter_errors(missing))


def test_test_definition_schema_rejects_unknown_test_and_setting_keys() -> None:
    schema_dir = Path('backend/data/config/v1/schemas')
    payload = json.loads(Path('backend/data/config/v1/test_definitions.json').read_text(encoding='utf-8'))
    schema = json.loads((schema_dir / 'test_definitions.schema.json').read_text(encoding='utf-8'))
    unknown_test = json.loads(json.dumps(payload))
    unknown_test['quick']['reaction']['practiceTrialz'] = 3
    unknown_setting = json.loads(json.dumps(payload))
    unknown_setting['detailedAdditions']['mentalStability']['recoverySecondz'] = 10
    assert list(Draft202012Validator(schema).iter_errors(unknown_test))
    assert list(Draft202012Validator(schema).iter_errors(unknown_setting))
