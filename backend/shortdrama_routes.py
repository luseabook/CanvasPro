"""短剧 HTTP 路由 — 可读,绕开全部混淆文件。
/api/shortdrama/* 单集闭环:建项目→网文入库→拆剧本→拆分镜→ffmpeg 合成 MP4。
LLM 拆解先用确定性 stub(后续接 aiTextApi),图先用 ffmpeg 纯色帧,确保链路不依赖外部即可出片。"""
import json
import os
import subprocess
try:
    from backend import shortdrama_db as db
    from backend import shortdrama_llm as llm
except ImportError:
    import shortdrama_db as db
    import shortdrama_llm as llm

FFMPEG = os.environ.get("AIC_FFMPEG_EXE", "ffmpeg")


def _out_dir():
    d = os.path.join(os.environ.get("APPDATA") or os.getcwd(), "CanvasPro", "output")
    os.makedirs(d, exist_ok=True)
    return d


def split_script(novel_text):
    """网文→1 集剧本(stub:整章即一集,后续接 LLM)。"""
    return novel_text.strip() or "（空章节）"


def split_storyboards(script_text, max_shots=6):
    """剧本→分镜(stub:按句切,每镜 5s)。返回 [{prompt,duration}]。"""
    parts = [s.strip() for s in script_text.replace("。", "。\n").splitlines() if s.strip()]
    return [{"prompt": p[:60], "duration": "5"} for p in parts[:max_shots]] or [
        {"prompt": script_text[:60], "duration": "5"}]


def render_mp4(project_id, script_id, color="0x1e293b"):
    """每镜生成纯色片段→concat→MP4。验证 ffmpeg 全链路。"""
    sbs = db.list_storyboards(script_id)
    out = _out_dir()
    clips = []
    for sb in sbs:
        cp = os.path.join(out, f"sb_{sb['id']}.mp4")
        dur = str(sb.get("duration") or "5").rstrip("s") or "5"
        subprocess.run([FFMPEG, "-y", "-f", "lavfi", "-i",
                        f"color=c={color}:s=720x1280:d={dur}", "-pix_fmt", "yuv420p", cp],
                       check=True, capture_output=True)
        clips.append(cp)
    listf = os.path.join(out, f"ep_{script_id}.txt")
    with open(listf, "w", encoding="utf-8") as f:
        for c in clips:
            f.write(f"file '{c.replace(chr(92), '/')}'\n")
    final = os.path.join(out, f"episode_{script_id}.mp4")
    subprocess.run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", listf, "-c", "copy", final],
                   check=True, capture_output=True)
    return final, len(clips)


def handle(path, body):
    """返回 (handled, status, data)。body 为 dict。"""
    if path == "/api/shortdrama/project":
        return True, 200, {"id": db.create_project(body.get("name", "未命名"),
                                                    artStyle=body.get("artStyle"), storyStyle=body.get("storyStyle"))}
    if path == "/api/shortdrama/pipeline":
        pid = body.get("projectId") or db.create_project(body.get("name", "网文短剧"))
        db.add_novel_chapter(pid, body.get("chapter", "第1章"), body.get("novel", ""), 1)
        script_text = split_script(body.get("novel", ""))
        sid = db.add_script(pid, "第1集", script_text, 1)
        for i, sb in enumerate(split_storyboards(script_text), 1):
            db.add_storyboard(pid, sid, i, sb["prompt"], sb["duration"])
        mp4, n = render_mp4(pid, sid)
        return True, 200, {"projectId": pid, "scriptId": sid, "shots": n, "mp4": mp4}
    return False, 404, None
