from __future__ import annotations

import json
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
    run_build_subprocess,
    move_output,
    DEST_OUTPUT,
)


class _Handler(BaseHTTPRequestHandler):
    server_version = "APWorldServer/1.0"

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
        try:
            print(f"[apworld_server] POST request received: path={self.path}")
            
            if self.path.rstrip("/") != "/apworld/build":
                print(f"[apworld_server] 404: Invalid path {self.path}")
                self._send_json(404, {"error": "Not found"})
                return

            content_length = int(self.headers.get("Content-Length", "0"))
            print(f"[apworld_server] Reading request body: content_length={content_length}")
            
            if content_length == 0:
                print("[apworld_server] Error: Content-Length is 0")
                self._send_json(400, {"error": "Request body is empty"})
                return
            
            raw = self.rfile.read(content_length)
            print(f"[apworld_server] Read {len(raw)} bytes from request body")
            
            ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip()
            print(f"[apworld_server] Content-Type: {ctype}")

            # Accept either raw YAML (preferred) or JSON {yaml: "..."} or {data: {...}}
            if ctype == "application/json":
                print("[apworld_server] Parsing JSON request body")
                try:
                    obj = json.loads(raw.decode("utf-8") or "{}")
                    if isinstance(obj.get("yaml"), str):
                        yaml_text = obj["yaml"]
                        print(f"[apworld_server] Extracted YAML from 'yaml' field ({len(yaml_text)} bytes)")
                    elif isinstance(obj.get("data"), dict):
                        yaml_text = yaml.safe_dump(obj["data"], sort_keys=False, allow_unicode=True)
                        print(f"[apworld_server] Converted 'data' object to YAML ({len(yaml_text)} bytes)")
                    else:
                        print("[apworld_server] Error: JSON body missing 'yaml' or 'data' field")
                        self._send_json(400, {"error": "Expected 'yaml' string or 'data' object"})
                        return
                except json.JSONDecodeError as e:
                    print(f"[apworld_server] JSON decode error: {e}")
                    self._send_json(400, {"error": f"Invalid JSON: {e}"})
                    return
            else:
                print("[apworld_server] Treating request body as raw YAML")
                try:
                    yaml_text = raw.decode("utf-8")
                    print(f"[apworld_server] Decoded YAML text ({len(yaml_text)} bytes)")
                except UnicodeDecodeError as e:
                    print(f"[apworld_server] Unicode decode error: {e}")
                    self._send_json(400, {"error": f"Invalid UTF-8 encoding: {e}"})
                    return

            if not yaml_text or not yaml_text.strip():
                print("[apworld_server] Error: YAML text is empty")
                self._send_json(400, {"error": "YAML content is empty"})
                return

            # Validate/normalize YAML minimally and persist to expected path
            print("[apworld_server] Parsing and validating YAML...")
            try:
                parsed = yaml.safe_load(yaml_text) or {}
                print(f"[apworld_server] YAML parsed successfully. Top-level keys: {list(parsed.keys())}")
                
                # Ensure expected nested keys exist; frontend should provide them
                if not isinstance(parsed, dict):
                    print(f"[apworld_server] Error: YAML root is not a dict, got {type(parsed)}")
                    self._send_json(400, {"error": "YAML root must be a mapping/dict"})
                    return
                    
                if "items" not in parsed:
                    print("[apworld_server] Error: 'items' key missing from YAML")
                    self._send_json(400, {"error": "YAML must contain 'items' key"})
                    return
                    
                if "locations" not in parsed:
                    print("[apworld_server] Error: 'locations' key missing from YAML")
                    self._send_json(400, {"error": "YAML must contain 'locations' key"})
                    return
                    
                normalized = yaml.safe_dump(parsed, sort_keys=False, allow_unicode=True)
                print(f"[apworld_server] YAML normalized and ready to write ({len(normalized)} bytes)")
            except yaml.YAMLError as exc:
                print(f"[apworld_server] YAML parse error: {exc}")
                self._send_json(400, {"error": f"Invalid YAML syntax: {exc}"})
                return
            except Exception as exc:
                print(f"[apworld_server] Unexpected error during YAML processing: {exc}")
                import traceback
                traceback.print_exc()
                self._send_json(400, {"error": f"Invalid YAML: {exc}"})
                return

            print(f"[apworld_server] Writing YAML to {YAML_PATH}")
            try:
                YAML_PATH.write_text(normalized, encoding="utf-8")
                print(f"[apworld_server] YAML written successfully to {YAML_PATH}")
            except Exception as e:
                print(f"[apworld_server] Error writing YAML file: {e}")
                import traceback
                traceback.print_exc()
                self._send_json(500, {"error": f"Failed to write YAML file: {e}"})
                return

            # Generate files and run build
            items = parsed.get("items") or {}
            locations = parsed.get("locations") or {}
            print(f"[apworld_server] Extracted items (keys: {list(items.keys())}) and locations (keys: {list(locations.keys())})")
            
            if not isinstance(items, dict):
                print(f"[apworld_server] Error: 'items' is not a dict, got {type(items)}")
                self._send_json(400, {"error": "'items' must be a mapping"})
                return
                
            if not isinstance(locations, dict):
                print(f"[apworld_server] Error: 'locations' is not a dict, got {type(locations)}")
                self._send_json(400, {"error": "'locations' must be a mapping"})
                return

            print("[apworld_server] Writing region names...")
            try:
                write_region_names(locations)
                print("[apworld_server] Region names written successfully")
            except Exception as e:
                print(f"[apworld_server] Error writing region names: {e}")
                import traceback
                traceback.print_exc()
                self._send_json(500, {"error": f"Failed to write region names: {e}"})
                return

            print("[apworld_server] Writing item names...")
            try:
                write_item_names(items)
                print("[apworld_server] Item names written successfully")
            except Exception as e:
                print(f"[apworld_server] Error writing item names: {e}")
                import traceback
                traceback.print_exc()
                self._send_json(500, {"error": f"Failed to write item names: {e}"})
                return

            print("[apworld_server] Running build subprocess...")
            try:
                code = run_build_subprocess()
                if code != 0:
                    print(f"[apworld_server] Build subprocess failed with exit code {code}")
                    self._send_json(500, {"error": "Build failed", "code": code})
                    return
                print("[apworld_server] Build subprocess completed successfully")
            except Exception as e:
                print(f"[apworld_server] Error running build subprocess: {e}")
                import traceback
                traceback.print_exc()
                self._send_json(500, {"error": f"Build subprocess error: {e}"})
                return

            print("[apworld_server] Moving output file...")
            try:
                move_output()
                print(f"[apworld_server] Output file moved successfully to {DEST_OUTPUT}")
            except Exception as e:
                print(f"[apworld_server] Error moving output file: {e}")
                import traceback
                traceback.print_exc()
                self._send_json(500, {"error": f"Failed to move output file: {e}"})
                return

            print("[apworld_server] APWorld generation completed successfully")
            self._send_json(200, {"ok": True, "artifact": str(DEST_OUTPUT)})
        except Exception as exc:  # pragma: no cover
            print(f"[apworld_server] Unhandled exception in do_POST: {exc}")
            import traceback
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})

    def do_GET(self) -> None:  # type: ignore[override]
        try:
            print(f"[apworld_server] GET request received: path={self.path}")
            
            if self.path.rstrip("/") != "/apworld/download":
                print(f"[apworld_server] 404: Invalid path {self.path}")
                self._send_json(404, {"error": "Not found"})
                return

            print(f"[apworld_server] Checking for output file at {DEST_OUTPUT}")
            if not DEST_OUTPUT.exists():
                print(f"[apworld_server] Error: Output file does not exist at {DEST_OUTPUT}")
                self._send_json(404, {"error": "Artifact not found"})
                return

            print(f"[apworld_server] Reading output file ({DEST_OUTPUT.stat().st_size} bytes)...")
            data = DEST_OUTPUT.read_bytes()
            print(f"[apworld_server] Sending {len(data)} bytes to client")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Disposition", "attachment; filename=chatipelago.apworld")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(data)
            print("[apworld_server] File download completed successfully")
        except Exception as exc:  # pragma: no cover
            print(f"[apworld_server] Error in do_GET: {exc}")
            import traceback
            traceback.print_exc()
            self._send_json(500, {"error": str(exc)})


def serve(port: int = 8123, bind_address: str = "0.0.0.0") -> None:
    print(f"[apworld_server] Starting server on port {port}...")
    try:
        httpd = ThreadingHTTPServer((bind_address, port), _Handler)
        print(f"[apworld_server] Server started successfully on http://{bind_address}:{port}")
        print("[apworld_server] Ready to accept requests at /apworld/build (POST) and /apworld/download (GET)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[apworld_server] Received keyboard interrupt, shutting down...")
            pass
    except OSError as e:
        print(f"[apworld_server] Failed to start server: {e}")
        if "Address already in use" in str(e) or e.errno == 98:
            print(f"[apworld_server] Port {port} is already in use. Is another instance running?")
        raise
    finally:
        try:
            httpd.server_close()
            print("[apworld_server] Server closed")
        except:
            pass


if __name__ == "__main__":
    # Bind to localhost only - Vite proxy on same machine will forward requests
    # This prevents direct browser access to port 8123
    # To bind to all interfaces (0.0.0.0), pass as second arg: serve(8123, "0.0.0.0")
    serve(8123, "127.0.0.1")


