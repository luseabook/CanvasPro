"""短剧数据层 — 纯 stdlib sqlite3,可读可测,server.py 单行 import 接入。
不碰任何混淆文件;表结构由 db/migrations/001 建好,这里只做 CRUD。
连同一个 userData/CanvasPro/shortdrama.db。"""
import os
import sqlite3
import time

_DB = None

def db_path():
    return os.environ.get("SHORTDRAMA_DB") or os.path.join(
        os.environ.get("APPDATA") or os.getcwd(), "CanvasPro", "shortdrama.db")

def conn():
    global _DB
    if _DB is None:
        os.makedirs(os.path.dirname(db_path()), exist_ok=True)
        _DB = sqlite3.connect(db_path(), check_same_thread=False)
        _DB.row_factory = sqlite3.Row
        _DB.execute("PRAGMA foreign_keys = ON")
    return _DB

def _now():
    return int(time.time() * 1000)

def create_project(name, project_type="shortdrama", **f):
    c = conn().execute(
        "INSERT INTO o_project(name,projectType,artStyle,storyStyle,createTime,updateTime) VALUES(?,?,?,?,?,?)",
        (name, project_type, f.get("artStyle"), f.get("storyStyle"), _now(), _now()))
    conn().commit()
    return c.lastrowid

def add_novel_chapter(project_id, chapter, data, idx):
    c = conn().execute(
        "INSERT INTO o_novel(projectId,chapter,chapterData,chapterIndex,createTime) VALUES(?,?,?,?,?)",
        (project_id, chapter, data, idx, _now()))
    conn().commit()
    return c.lastrowid

def add_script(project_id, name, content, episode_index):
    c = conn().execute(
        "INSERT INTO o_script(projectId,name,content,episodeIndex,createTime) VALUES(?,?,?,?,?)",
        (project_id, name, content, episode_index, _now()))
    conn().commit()
    return c.lastrowid

def add_storyboard(project_id, script_id, index_, prompt, duration):
    c = conn().execute(
        "INSERT INTO o_storyboard(projectId,scriptId,index_,prompt,duration,createTime) VALUES(?,?,?,?,?,?)",
        (project_id, script_id, index_, prompt, duration, _now()))
    conn().commit()
    return c.lastrowid

def list_storyboards(script_id):
    return [dict(r) for r in conn().execute(
        "SELECT * FROM o_storyboard WHERE scriptId=? ORDER BY index_", (script_id,))]

def enqueue_task(task_class, project_id=None, script_id=None, related=None, source="short_drama"):
    c = conn().execute(
        "INSERT INTO o_tasks(taskClass,projectId,scriptId,relatedObjects,legacySource,startTime) VALUES(?,?,?,?,?,?)",
        (task_class, project_id, script_id, related, source, _now()))
    conn().commit()
    return c.lastrowid
