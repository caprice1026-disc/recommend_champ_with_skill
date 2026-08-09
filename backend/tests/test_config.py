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
