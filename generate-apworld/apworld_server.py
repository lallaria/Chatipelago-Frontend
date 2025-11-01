from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

try:
    import yaml  # type: ignore
except Exception as exc:  # pragma: no cover
    raise RuntimeError("PyYAML is required. Install with: pip install pyyaml") from exc

from generateapworld import (
    YAML_PATH,
    write_region_names,
    write_item_names,
    run_build_apworld,
    move_output,
    DEST_OUTPUT,
)


class _Handler(BaseHTTPRequestHandler):
    server_version = "APWorldServer/1.4"
    _build_lock = threading.Lock()

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # type: ignore[override]
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self) -> None:  # type: ignore[override]
        if self.path.rstrip("/") != "/apworld/build":
            self._send_json(404, {"error": "Not found"})
            return

        # Serialize build requests - only one build at a time
        with self._build_lock:
            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                if content_length == 0:
                    self._send_json(400, {"error": "Request body is empty"})
                    return

                raw = self.rfile.read(content_length)
                ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip()

                # Accept either raw YAML (preferred) or JSON {yaml: "..."} or {data: {...}}
                if ctype == "application/json":
                    try:
                        obj = json.loads(raw.decode("utf-8") or "{}")
                        if isinstance(obj.get("yaml"), str):
                            yaml_text = obj["yaml"]
                        elif isinstance(obj.get("data"), dict):
                            yaml_text = yaml.safe_dump(obj["data"], sort_keys=False, allow_unicode=True)
                        else:
                            self._send_json(400, {"error": "Expected 'yaml' string or 'data' object"})
                            return
                    except json.JSONDecodeError as e:
                        self._send_json(400, {"error": f"Invalid JSON: {e}"})
                        return
                else:
                    try:
                        yaml_text = raw.decode("utf-8")
                    except UnicodeDecodeError as e:
                        self._send_json(400, {"error": f"Invalid UTF-8 encoding: {e}"})
                        return

                if not yaml_text or not yaml_text.strip():
                    self._send_json(400, {"error": "YAML content is empty"})
                    return

                # Validate/normalize YAML minimally and persist to expected path
                try:
                    parsed = yaml.safe_load(yaml_text) or {}
                    if not isinstance(parsed, dict):
                        self._send_json(400, {"error": "YAML root must be a mapping/dict"})
                        return
                    if "items" not in parsed:
                        self._send_json(400, {"error": "YAML must contain 'items' key"})
                        return
                    if "locations" not in parsed:
                        self._send_json(400, {"error": "YAML must contain 'locations' key"})
                        return
                    normalized = yaml.safe_dump(parsed, sort_keys=False, allow_unicode=True)
                except yaml.YAMLError as exc:
                    self._send_json(400, {"error": f"Invalid YAML syntax: {exc}"})
                    return
                except Exception as exc:
                    self._send_json(400, {"error": f"Invalid YAML: {exc}"})
                    return

                try:
                    YAML_PATH.write_text(normalized, encoding="utf-8")
                except Exception as e:
                    self._send_json(500, {"error": f"Failed to write YAML file: {e}"})
                    return

                # Generate files and run build
                items = parsed.get("items") or {}
                locations = parsed.get("locations") or {}
                if not isinstance(items, dict):
                    self._send_json(400, {"error": "'items' must be a mapping"})
                    return
                if not isinstance(locations, dict):
                    self._send_json(400, {"error": "'locations' must be a mapping"})
                    return

                try:
                    write_region_names(locations)
                except Exception as e:
                    self._send_json(500, {"error": f"Failed to write region names: {e}"})
                    return

                try:
                    write_item_names(items)
                except Exception as e:
                    self._send_json(500, {"error": f"Failed to write item names: {e}"})
                    return

                try:
                    code = run_build_apworld()
                    if code != 0:
                        self._send_json(500, {"error": "Build failed", "code": code})
                        return
                except Exception as e:
                    self._send_json(500, {"error": f"Build subprocess error: {e}"})
                    return

                try:
                    move_output()
                except Exception as e:
                    self._send_json(500, {"error": f"Failed to move output file: {e}"})
                    return

                self._send_json(200, {"ok": True, "artifact": str(DEST_OUTPUT)})
            except Exception as exc:  # pragma: no cover
                self._send_json(500, {"error": str(exc)})

    def do_GET(self) -> None:  # type: ignore[override]
        try:
            if self.path.rstrip("/") != "/apworld/download":
                self._send_json(404, {"error": "Not found"})
                return

            if not DEST_OUTPUT.exists():
                self._send_json(404, {"error": "Artifact not found"})
                return

            data = DEST_OUTPUT.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", "attachment; filename=chatipelago.apworld")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:  # pragma: no cover
            self._send_json(500, {"error": str(exc)})


def serve(port: int = 8123, bind_address: str = "0.0.0.0") -> None:
    try:
        httpd = ThreadingHTTPServer((bind_address, port), _Handler)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    except OSError as e:
        raise
    finally:
        try:
            httpd.server_close()
        except:
            pass


if __name__ == "__main__":
    # Bind to localhost only - Vite proxy on same machine will forward requests
    # This prevents direct browser access to port 8123
    # To bind to all interfaces (0.0.0.0), pass as second arg: serve(8123, "0.0.0.0")
    serve(8123, "127.0.0.1")


