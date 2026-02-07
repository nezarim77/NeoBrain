#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
import re
from urllib.parse import urlparse, parse_qs
import threading

PORT = 8000

# Global room storage: {roomCode: gameState}
rooms = {}
rooms_lock = threading.Lock()

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]  # Remove query string
        
        # API: Get room state
        if path.startswith('/api/rooms/'):
            self.handle_api_get(path)
        # HTML routes
        elif path == '/':
            self.path = '/index.html'
            super().do_GET()
        elif path.startswith('/host'):
            self.path = '/host.html'
            super().do_GET()
        elif path.startswith('/viewer'):
            self.path = '/viewer.html'
            super().do_GET()
        else:
            # Serve other static files normally
            super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0]
        
        # API: Save room state
        if path.startswith('/api/rooms/'):
            self.handle_api_post(path)
        else:
            self.send_response(404)
            self.end_headers()

    def handle_api_get(self, path):
        """Handle GET /api/rooms/{roomCode}/state"""
        match = re.match(r'/api/rooms/([A-Z0-9]+)/state', path)
        if not match:
            self.send_error(404)
            return
        
        room_code = match.group(1)
        
        with rooms_lock:
            state = rooms.get(room_code)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if state:
            self.wfile.write(json.dumps(state).encode('utf-8'))
        else:
            self.wfile.write(json.dumps(None).encode('utf-8'))

    def handle_api_post(self, path):
        """Handle POST /api/rooms/{roomCode}/state"""
        match = re.match(r'/api/rooms/([A-Z0-9]+)/state', path)
        if not match:
            self.send_error(404)
            return
        
        room_code = match.group(1)
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            state = json.loads(body.decode('utf-8'))
            with rooms_lock:
                rooms[room_code] = state
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Change to the project directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create the server
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"  Home: http://localhost:{PORT}/")
    print(f"  Host: http://localhost:{PORT}/host")
    print(f"  Viewer: http://localhost:{PORT}/viewer")
    print(f"  API: http://localhost:{PORT}/api/rooms/...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
