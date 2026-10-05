"""
======================================================================
  VINATECH MES - HYBRID SECURE API RELAY SERVER (tools/api_relay.py)
  Bridge between Vercel Edge Web Portal & Internal On-Premise CLI Hubs
  Author: Nguyen Van Duc (vanduc - EA Team)
======================================================================
"""

import http.server
import json
import os
import subprocess
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

PORT = int(os.environ.get("MES_RELAY_PORT", 5000))
SECRET_TOKEN = os.environ.get("MES_RELAY_SECRET", "vinatech_secret_token_2026")

script_dir = os.path.dirname(os.path.abspath(__file__))
candidate = script_dir
WORKSPACE_DIR = script_dir
while candidate and candidate != os.path.dirname(candidate):
    if os.path.exists(os.path.join(candidate, "mes.ps1")):
        WORKSPACE_DIR = candidate
        break
    candidate = os.path.dirname(candidate)

def run_cli_command(cmd_args):
    """Executes powershell CLI command within MES_POP directory and captures output"""
    cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command"] + cmd_args
    try:
        res = subprocess.run(cmd, cwd=WORKSPACE_DIR, capture_output=True, text=True, timeout=30, encoding="utf-8", errors="replace")
        return {
            "success": res.returncode == 0,
            "stdout": res.stdout,
            "stderr": res.stderr
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

class RelayHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _check_auth(self):
        auth_header = self.headers.get("Authorization", "")
        if not SECRET_TOKEN:
            return True
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            return token == SECRET_TOKEN
        return False

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        if not self._check_auth():
            self.send_response(401)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized"}).encode("utf-8"))
            return

        if path == "/api/health":
            result = run_cli_command([".\\mes.ps1", "health"])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "relay_status": "ONLINE",
                "raw_output": result.get("stdout", "")
            }).encode("utf-8"))

        elif path == "/api/trace":
            target = params.get("target", [""])[0]
            # Lay Native JSON truc tiep tu pop_trace.ps1 -Json
            json_res = run_cli_command([".\\tools\\pop_trace.ps1", "-Target", f'"{target}"', "-Json"])
            
            response_payload = {
                "success": json_res.get("success", False),
                "output": json_res.get("stdout", ""),
                "stdout": json_res.get("stdout", "")
            }
            try:
                out_str = json_res.get("stdout", "").strip()
                if out_str and out_str.startswith("{"):
                    response_payload["structured"] = json.loads(out_str)
            except Exception:
                pass
            
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_payload).encode("utf-8"))

        elif path == "/api/pack":
            target = params.get("target", [""])[0]
            result = run_cli_command([".\\mes.ps1", "pack", f'"{target}"'])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/user":
            target = params.get("target", [""])[0]
            result = run_cli_command([".\\mes.ps1", "user", f'"{target}"'])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/sync":
            line = params.get("line", [""])[0]
            cmd = [".\\mes.ps1", "sync"]
            if line:
                cmd.extend(["-Line", f'"{line}"'])
            result = run_cli_command(cmd)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/locks":
            profile = params.get("profile", ["SmartFactoryV2"])[0]
            result = run_cli_command([".\\mes.ps1", "locks", "-Profile", f'"{profile}"'])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/screen":
            screen_id = params.get("id", ["B530"])[0]
            result = run_cli_command([".\\mes.ps1", "screen", f'"{screen_id}"'])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/lineage":
            target = params.get("target", [""])[0]
            result = run_cli_command([".\\mes.ps1", "lineage", f'"{target}"'])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/gw":
            target = params.get("target", [""])[0]
            result = run_cli_command([".\\mes.ps1", "gw", f'"{target}"'])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/b598-price":
            target = params.get("target", [""])[0]
            cmd = [".\\mes.ps1", "b598-price"]
            if target:
                cmd.extend(["-Target", f'"{target}"'])
            result = run_cli_command(cmd)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        elif path == "/api/weekly-report":
            start_date = params.get("startDate", [""])[0]
            end_date = params.get("endDate", [""])[0]
            cmd = [".\\mes.ps1", "weekly-report"]
            if start_date:
                cmd.extend(["-StartDate", f'"{start_date}"'])
            if end_date:
                cmd.extend(["-EndDate", f'"{end_date}"'])
            result = run_cli_command(cmd)
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))

        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

    def do_POST(self):
        if not self._check_auth():
            self.send_response(401)
            self._send_cors_headers()
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/api/deploy":
            try:
                import time
                data = json.loads(body)
                sql_content = data.get("sql", "")
                profile = data.get("profile", "SmartFactoryV2")
                dry_run = data.get("dryRun", False)

                # Save temporary hotfix sql file in scratch/
                scratch_dir = os.path.join(WORKSPACE_DIR, "scratch")
                os.makedirs(scratch_dir, exist_ok=True)
                temp_sql_path = os.path.join(scratch_dir, f"web_hotfix_{int(time.time())}.sql")
                with open(temp_sql_path, "w", encoding="utf-8") as f:
                    f.write(sql_content)

                # Execute safely via deploy_tool.ps1
                cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
                       os.path.join(WORKSPACE_DIR, "tools", "deploy_tool.ps1"),
                       "-SqlPath", f'"{temp_sql_path}"', "-Profile", f'"{profile}"']
                result = run_cli_command(cmd)

                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": result.get("success", False),
                    "mode": "DRY_RUN" if dry_run else "COMMIT",
                    "stdout": result.get("stdout", ""),
                    "stderr": result.get("stderr", ""),
                    "rowsAffected": 1
                }).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif parsed.path == "/api/query":
            try:
                data = json.loads(body)
                query_sql = data.get("query", "")
                profile = data.get("profile", "SmartFactoryV2")
                cmd = [".\\mes.ps1", "query", f'"{query_sql}"', "-Profile", f'"{profile}"']
                result = run_cli_command(cmd)
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

if __name__ == "__main__":
    print(f"[*] Starting Vinatech MES Relay Server on port {PORT}...")
    print(f"[*] Workspace: {WORKSPACE_DIR}")
    server = ThreadedHTTPServer(("0.0.0.0", PORT), RelayHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping relay server.")
        server.server_close()
