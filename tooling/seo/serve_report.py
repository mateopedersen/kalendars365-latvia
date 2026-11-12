"""Read-only loopback presentation of the private report; no archives or source dumps."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote,urlsplit
import argparse
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--port',type=int,default=4015);a=p.parse_args();root=Path(a.root).resolve()
class Report(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 def do_GET(self):
  path=unquote(urlsplit(self.path).path);rel=path.lstrip('/') or 'index.html';target=(root/rel).resolve()
  valid=target.is_relative_to(root) and target.is_file() and target.suffix in ['.html','.md','.csv','.json','.png','.jpg','.jpeg'] and (len(Path(rel).parts)==1 or Path(rel).parts[0] in ['images','evidence'])
  if not valid:self.send_error(404);return
  super().do_GET()
 def do_HEAD(self):
  self.send_response(405);self.end_headers()
 def end_headers(self):
  self.send_header('X-Robots-Tag','noindex, nofollow');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");super().end_headers()
 def log_message(self,*args):pass
print('Private report: http://127.0.0.1:'+str(a.port),flush=True)
ThreadingHTTPServer(('127.0.0.1',a.port),Report).serve_forever()
