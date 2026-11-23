"""Read-only loopback presentation of the private report; no archives or source dumps."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from os import fstat
from pathlib import Path, PurePosixPath
from shutil import copyfileobj
from urllib.parse import unquote,urlsplit
import argparse
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',type=int,default=4015);a=p.parse_args();root=Path(a.root).resolve()
def report_file(url):
 parts = PurePosixPath(unquote(urlsplit(url).path).lstrip('/') or 'index.html').parts
 if not parts or (len(parts) > 1 and parts[0] not in {'images', 'evidence'}):
  return None
 target = root
 for name in parts:
  if not target.is_dir():
   return None
  target = next((entry for entry in target.iterdir() if entry.name == name), None)
  if target is None or target.is_symlink():
   return None
 if not target.is_file() or target.suffix not in {'.html', '.md', '.csv', '.json', '.png', '.jpg', '.jpeg'}:
  return None
 return target

class Report(SimpleHTTPRequestHandler):
 def do_GET(self):
  try:
   target = report_file(self.path)
   if target is None:
    self.send_error(404)
    return
   body = target.open('rb')
  except (OSError, ValueError):
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
