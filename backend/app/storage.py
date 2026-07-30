from __future__ import annotations

import json
import os
import sqlite3
import uuid
from pathlib import Path
from typing import Any


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / 'data' / 'lol_skill_lab.sqlite3'


def database_path() -> Path:
    configured = os.environ.get('LOL_SKILL_LAB_DB')
    return Path(configured) if configured else DEFAULT_DB_PATH


def connect() -> sqlite3.Connection:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute(
        'CREATE TABLE IF NOT EXISTS diagnosis_results ('
        'result_id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL)'
    )
    connection.execute(
        'CREATE TABLE IF NOT EXISTS feedback ('
        'feedback_id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL)'
    )
    connection.commit()
    return connection


def save_diagnosis(payload: dict[str, Any]) -> str:
    result_id = f'result_{uuid.uuid4().hex}'
    with connect() as connection:
        connection.execute(
            'INSERT INTO diagnosis_results(result_id, payload, created_at) VALUES (?, ?, ?)',
            (result_id, json.dumps(payload, ensure_ascii=False), payload['createdAt']),
        )
        connection.commit()
    return result_id


def delete_diagnosis(result_id: str) -> bool:
    with connect() as connection:
        cursor = connection.execute('DELETE FROM diagnosis_results WHERE result_id = ?', (result_id,))
        connection.commit()
        return cursor.rowcount > 0


def save_feedback(payload: dict[str, Any]) -> str:
    feedback_id = f'feedback_{uuid.uuid4().hex}'
    with connect() as connection:
        connection.execute(
            'INSERT INTO feedback(feedback_id, payload, created_at) VALUES (?, ?, datetime(\'now\'))',
            (feedback_id, json.dumps(payload, ensure_ascii=False)),
        )
        connection.commit()
    return feedback_id
