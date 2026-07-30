from backend.app.config_loader import load_all_config, load_champion_lanes, load_champions


def test_versioned_config_is_schema_valid_and_complete() -> None:
    config = load_all_config()
    assert config['manifest']['schemaVersion'] == '1.0.0'
    assert len(config['champions']) >= 9
    assert len(config['championLanes']) >= 9
    assert len(config['tests']['detailedAdditions']) == 8
    assert {category['id'] for category in config['categories']['categories']} == {
        'ready_now', 'growth_candidate', 'aspirational'
    }


def test_champion_lane_keys_are_unique() -> None:
    keys = {(profile['championId'], profile['lane']) for profile in load_champion_lanes()}
    assert len(keys) == len(load_champion_lanes())
    assert len({profile['championId'] for profile in load_champions()}) >= 9
