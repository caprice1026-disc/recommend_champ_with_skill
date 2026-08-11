from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config_loader import load_champion_lanes, load_champions, load_config, load_manifest
from .schemas import DiagnosisSaveRequest, FeedbackRequest
from .storage import delete_diagnosis, save_diagnosis, save_feedback


app = FastAPI(title='LoLスキルラボ API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'DELETE'],
    allow_headers=['*'],
)


@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok', 'service': 'lol-skill-lab'}


@app.get('/api/config/manifest')
def manifest() -> dict:
    return load_manifest()


@app.get('/api/config/tests')
def tests() -> dict:
    return load_config('test_definitions.json')


@app.get('/api/profiles/champions')
def champions() -> dict:
    return {'schemaVersion': '1.0.0', 'profiles': load_champions()}


@app.get('/api/profiles/champion-lanes')
def champion_lanes() -> dict:
    return {'schemaVersion': '1.0.0', 'profiles': load_champion_lanes()}


@app.post('/api/feedback', status_code=status.HTTP_201_CREATED)
def feedback(request: FeedbackRequest) -> dict[str, bool | str]:
    feedback_id = save_feedback(request.model_dump(mode='json'))
    return {'received': True, 'feedbackId': feedback_id}


@app.post('/api/diagnosis-results', status_code=status.HTTP_201_CREATED)
def save_result(request: DiagnosisSaveRequest) -> dict[str, bool | str]:
    if not request.consentToSave:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='保存への明示同意が必要です')
    payload = request.model_dump(mode='json')
    payload.pop('consentToSave', None)
    result_id = save_diagnosis(payload)
    return {'resultId': result_id, 'saved': True}


@app.delete('/api/diagnosis-results/{result_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_result(result_id: str) -> Response:
    if not delete_diagnosis(result_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='保存結果が見つかりません')
    return Response(status_code=status.HTTP_204_NO_CONTENT)


frontend_dist = Path(__file__).resolve().parents[2] / 'frontend' / 'dist'
if frontend_dist.exists():
    app.mount('/', StaticFiles(directory=frontend_dist, html=True), name='frontend')
