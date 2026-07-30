from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_and_manifest_are_available() -> None:
    assert client.get('/api/health').json() == {'status': 'ok', 'service': 'lol-skill-lab'}
    manifest = client.get('/api/config/manifest')
    assert manifest.status_code == 200
    assert manifest.json()['diagnosisVersion'] == '1.0.0'


def test_profiles_are_versioned_and_have_lane_context() -> None:
    response = client.get('/api/profiles/champion-lanes')
    assert response.status_code == 200
    body = response.json()
    assert body['schemaVersion'] == '1.0.0'
    assert len(body['profiles']) >= 9
    assert all(profile['championId'] and profile['lane'] for profile in body['profiles'])


def test_save_requires_explicit_consent_and_rejects_raw_logs() -> None:
    payload = {
        'diagnosisVersion': '1.0.0',
        'consentToSave': False,
        'abilityVector': {'reaction': 0.7},
        'subscores': {},
        'confidence': {'reaction': 0.8},
        'recommendations': {},
        'aptitudeTypes': {},
        'configVersions': {'diagnosisVersion': '1.0.0'},
        'createdAt': '2026-07-31T00:00:00Z',
    }
    assert client.post('/api/diagnosis-results', json=payload).status_code == 403

    payload['consentToSave'] = True
    payload['rawLogs'] = [{'x': 1}]
    assert client.post('/api/diagnosis-results', json=payload).status_code == 422


def test_feedback_is_separate_from_diagnosis_storage() -> None:
    response = client.post('/api/feedback', json={
        'diagnosisVersion': '1.0.0',
        'satisfaction': 'partial',
        'selfReportedStrongChampions': ['グラガス'],
        'comment': '説明が分かりやすかった',
    })
    assert response.status_code == 201
    assert response.json()['received'] is True
