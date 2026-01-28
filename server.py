#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL path
        path = self.path.split('?')[0]  # Remove query string
        
        # Route mapping
        if path == '/':
            # Serve index.html for root (homepage)
            self.path = '/index.html'
        elif path.startswith('/host'):
            # Serve host.html for /host
            self.path = '/host.html'
        elif path.startswith('/viewer'):
            # Serve viewer.html for /viewer
            self.path = '/viewer.html'
        
        # Call parent's do_GET to serve the file
        return super().do_GET()

# Change to the project directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create the server
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"  Home: http://localhost:{PORT}/")
    print(f"  Host: http://localhost:{PORT}/host")
    print(f"  Viewer: http://localhost:{PORT}/viewer")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
