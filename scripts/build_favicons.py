"""Stable, original brand favicon. PNG and ICO, no external artwork."""
import math,struct,zlib
from pathlib import Path
def png(size):
 scale=4;n=size*scale;px=bytearray(n*n*4)
 def rect(x0,y0,x1,y1,c,r=0):
  for y in range(max(0,int(y0*n)),min(n,int(y1*n)+1)):
   for x in range(max(0,int(x0*n)),min(n,int(x1*n)+1)):
    X=x/n;Y=y/n
    if r:
     cx=min(max(X,x0+r),x1-r);cy=min(max(Y,y0+r),y1-r)
     if (X-cx)**2+(Y-cy)**2>r*r:continue
    i=(y*n+x)*4;px[i:i+4]=bytes(c)
 rect(.12,.15,.92,.94,(58,34,43,65),.1)
 rect(.08,.11,.88,.9,(118,31,52,255),.09)
 rect(.12,.15,.84,.86,(255,250,239,255),.06)
 rect(.12,.15,.84,.36,(145,31,58,255),.04)
 for x in [.29,.66]:rect(x-.035,.06,x+.035,.26,(220,190,137,255),.03)
 for row in range(3):
  for col in range(3):
   x=.23+col*.18;y=.45+row*.13
   rect(x,y,x+.105,y+.08,(145,31,58,255) if(row,col)==(1,1) else (110,114,115,255),.01)
 small=bytearray()
 for y in range(size):
  small.append(0)
  for x in range(size):
   for k in range(4):small.append(sum(px[((y*scale+dy)*n+x*scale+dx)*4+k] for dy in range(scale) for dx in range(scale))//(scale*scale))
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(small),9))+chunk(b'IEND',b'')
for size in [48,96,180,192]:
 Path('assets/favicon-'+str(size)+'.png').write_bytes(png(size))
imgs=[(s,png(s))for s in [16,32,48,96]];offset=6+16*len(imgs);head=struct.pack('<HHH',0,1,len(imgs));body=b''
for s,b in imgs:
 head+=struct.pack('<BBBBHHII',s,s,0,0,1,32,len(b),offset);body+=b;offset+=len(b)
Path('favicon.ico').write_bytes(head+body)
Path('assets/favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="11" width="80" height="79" rx="9" fill="#761f34"/><rect x="12" y="15" width="72" height="71" rx="6" fill="#fffaef"/><rect x="12" y="15" width="72" height="21" rx="4" fill="#911f3a"/><g fill="#dcbe89"><rect x="25.5" y="6" width="7" height="20" rx="3"/><rect x="62.5" y="6" width="7" height="20" rx="3"/></g><g fill="#6e7273">'+''.join('<rect x="'+str(23+c*18)+'" y="'+str(45+r*13)+'" width="10.5" height="8" rx="1" '+('fill="#911f3a"' if(r,c)==(1,1) else '')+'/>'for r in range(3)for c in range(3))+'</g></svg>')
