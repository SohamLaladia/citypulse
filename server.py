#!/usr/bin/env python3
"""
CityPulse - Unified Application Server
Serves the CityPulse frontend application and the AI FastAPI backend together.
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 encoding on Windows consoles without charmap crashes
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DIRECTORY = Path(__file__).resolve().parent
BACKEND_DIR = DIRECTORY / "backend"

def main():
    port = int(os.environ.get("PORT", 8000))
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    print("=" * 68)
    print("🏙️  CITYPULSE — AI-Powered Civic Complaint Platform")
    print("   Theme 1: Civic Pulse — Digital Governance and Public Information")
    print("   Tagline: Making Every Civic Voice Count")
    print("=" * 68)
    print(f"🚀 Application URL : http://localhost:{port}")
    print(f"📁 Serving Root    : {DIRECTORY}")
    print(f"🤖 Backend Engine  : FastAPI + Gemini Multimodal AI")
    print(f"🛑 Press Ctrl+C to stop the server")
    print("=" * 68)

    try:
        import uvicorn
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=port,
            app_dir=str(BACKEND_DIR),
            reload=False
        )
    except ImportError:
        print("\n⚠️  Uvicorn not found in environment. Falling back to static http.server...")
        import http.server
        import socketserver
        socketserver.TCPServer.allow_reuse_address = True
        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(DIRECTORY), **kwargs)
        with socketserver.TCPServer(("", port), Handler) as httpd:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down CityPulse server...")
                httpd.shutdown()

if __name__ == "__main__":
    main()
