"""Read-only loopback presentation of the private report; no archives or source dumps."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from os import fstat
from pathlib import Path
from shutil import copyfileobj
from urllib.parse import unquote,urlsplit
import argparse
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',type=int,default=4015);a=p.parse_args();root=Path(a.root).resolve()
class Report(SimpleHTTPRequestHandler):
 def do_GET(self):
  try:
   relative = Path(unquote(urlsplit(self.path).path).lstrip('/') or 'index.html')
   target = (root / relative).resolve(strict=True)
   report_path = target.relative_to(root)
  except (OSError, ValueError, RuntimeError):
   self.send_error(404)
   return
  if (not target.is_file()
      or target.suffix not in {'.html', '.md', '.csv', '.json', '.png', '.jpg', '.jpeg'}
      or (len(report_path.parts) != 1 and report_path.parts[0] not in {'images', 'evidence'})):
   self.send_error(404)
   return
  try:
   body = target.open('rb')
  except OSError:
   self.send_error(404)
   return
  with body:
   self.send_response(200)
   self.send_header('Content-Type', self.guess_type(str(target)))
   self.send_header('Content-Length', str(fstat(body.fileno()).st_size))
   self.end_headers()
   copyfileobj(body, self.wfile)
 def do_HEAD(self):
  self.send_response(405);self.end_headers()
 def end_headers(self):
  self.send_header('X-Robots-Tag','noindex, nofollow');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");super().end_headers()
 def log_message(self,*args):pass
print('Private report: http://127.0.0.1:'+str(a.port),flush=True)
ThreadingHTTPServer(('127.0.0.1',a.port),Report).serve_forever()
