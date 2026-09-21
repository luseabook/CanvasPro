"""短剧 LLM 调用 — 复用 server.py 已验证的 apimart 配置(apiUrl/apiKey/model)。
无 key 时返回 None,调用方降级到确定性 stub,保证无外网也能出片。可读,不碰混淆。"""
import json
import os

def _cfg():
    try:
        from backend.services.config_route_service import ConfigRouteService
    except Exception:
        return None
    try:
        c = ConfigRouteService(os.environ.get("AIC_CONFIG_PATH") or "user/config.json").get_custom_ai_config()
    except Exception:
        return None
    if not c.get("apiUrl") or not c.get("apiKey"):
        return None
    return c

def complete(prompt, max_tokens=2000):
    c = _cfg()
    if not c:
        return None
    try:
        import requests
        url = c["apiUrl"].rstrip("/")
        endpoint = url if url.endswith(("/chat/completions", "/responses")) else url + "/chat/completions"
        resp = requests.post(endpoint, timeout=300, headers={
            "Authorization": "Bearer " + c["apiKey"], "Content-Type": "application/json"},
            data=json.dumps({"model": c.get("model") or "gpt-4o-mini",
                             "messages": [{"role": "user", "content": prompt}], "max_tokens": max_tokens}))
        j = resp.json()
        return j["choices"][0]["message"]["content"]
    except Exception:
        return None
