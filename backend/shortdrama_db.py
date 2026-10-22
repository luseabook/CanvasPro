"""短剧数据层 — 纯 stdlib sqlite3,可读可测,server.py 单行 import 接入。
首次连接按共享 schema 幂等初始化;与 Knex 迁移兼容，不删除已有数据。
连同一个 userData/OneFrame/shortdrama.db（旧版 CanvasPro 目录仍会回退复用）。"""
import os
import sqlite3
import time
import threading
from functools import wraps
from pathlib import Path

_DB = None
_DB_LOCK = threading.RLock()

# 换牌：新目录 OneFrame；旧的 CanvasPro / AI CanvasPro 只作为**回退**（只读复用，不迁移
# 数据库文件：SQLite 在运行中被复制容易拿到半写状态）。新目录一旦存在就优先用它。
BRAND_DATA_DIRNAME = "OneFrame"
LEGACY_DATA_DIRNAMES = ("CanvasPro", "AI CanvasPro")

def app_data_dir():
    base = os.environ.get("APPDATA") or os.getcwd()
    brand_dir = os.path.join(base, BRAND_DATA_DIRNAME)
    if os.path.isdir(brand_dir):
        return brand_dir
    for legacy in LEGACY_DATA_DIRNAMES:
        legacy_dir = os.path.join(base, legacy)
        if os.path.isdir(legacy_dir):
            return legacy_dir
    return brand_dir

def db_path():
    return os.environ.get("SHORTDRAMA_DB") or os.path.join(app_data_dir(), "shortdrama.db")

def conn():
    global _DB
    with _DB_LOCK:
        if _DB is None:
            path = os.path.abspath(db_path())
            os.makedirs(os.path.dirname(path), exist_ok=True)
            database = sqlite3.connect(path, check_same_thread=False, timeout=10)
            try:
                database.row_factory = sqlite3.Row
                database.execute("PRAGMA foreign_keys = ON")
                schema = (Path(__file__).resolve().parent.parent / "db" / "shortdrama-schema.sql").read_text(encoding="utf-8")
                database.executescript("BEGIN IMMEDIATE;\n" + schema + "\nCOMMIT;")
            except Exception:
                database.rollback()
                database.close()
                raise
            _DB = database
        return _DB

def _serialized(operation):
    @wraps(operation)
    def execute(*args, **kwargs):
        with _DB_LOCK:
            try:
                return operation(*args, **kwargs)
            except Exception:
                if _DB is not None:
                    _DB.rollback()
                raise
    return execute

def _now():
    return int(time.time() * 1000)

@_serialized
def create_project(name, project_type="shortdrama", **f):
    c = conn().execute(
        "INSERT INTO o_project(name,projectType,artStyle,storyStyle,createTime,updateTime) VALUES(?,?,?,?,?,?)",
        (name, project_type, f.get("artStyle"), f.get("storyStyle"), _now(), _now()))
    conn().commit()
    return c.lastrowid

@_serialized
def add_novel_chapter(project_id, chapter, data, idx):
    c = conn().execute(
        "INSERT INTO o_novel(projectId,chapter,chapterData,chapterIndex,createTime) VALUES(?,?,?,?,?)",
        (project_id, chapter, data, idx, _now()))
    conn().commit()
    return c.lastrowid

@_serialized
def add_script(project_id, name, content, episode_index):
    c = conn().execute(
        "INSERT INTO o_script(projectId,name,content,episodeIndex,createTime) VALUES(?,?,?,?,?)",
        (project_id, name, content, episode_index, _now()))
    conn().commit()
    return c.lastrowid

@_serialized
def add_storyboard(project_id, script_id, index_, prompt, duration):
    c = conn().execute(
        "INSERT INTO o_storyboard(projectId,scriptId,index_,prompt,duration,createTime) VALUES(?,?,?,?,?,?)",
        (project_id, script_id, index_, prompt, duration, _now()))
    conn().commit()
    return c.lastrowid

@_serialized
def list_storyboards(script_id):
    return [dict(r) for r in conn().execute(
        "SELECT * FROM o_storyboard WHERE scriptId=? ORDER BY index_", (script_id,))]

@_serialized
def enqueue_task(task_class, project_id=None, script_id=None, related=None, source="short_drama"):
    c = conn().execute(
        "INSERT INTO o_tasks(taskClass,projectId,scriptId,relatedObjects,legacySource,startTime) VALUES(?,?,?,?,?,?)",
        (task_class, project_id, script_id, related, source, _now()))
    conn().commit()
    return c.lastrowid
