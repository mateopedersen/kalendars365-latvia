"""Add decorative export icons without reserializing or changing HTML controls."""
import argparse, json, re
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RULES=json.loads((ROOT/'_data/action-icon-rules.json').read_text())['rules']
FORMATS=re.compile(r'\.(?:pdf|webp|xlsx?|docx?|ics|csv|json|png|jpe?g|svg)(?:[?#]|$)',re.I)

def classify(c):
    tag,a,text=c['tag'],c['attrs'],c['text']
    if any(key in a for key in ['data-edit-event','data-delete-event','data-delete-task','data-date','data-add-date','data-month','data-view','data-category']):return None
    if tag=='label' and not c['fileInput']: return None
    if tag=='a' and 'download' not in a and not re.search(r'button|action|download|export|format',a.get('class',''),re.I) and not FORMATS.search(a.get('href','')): return None
    if tag=='label': return 'file-image' if re.search(r'JPG|PNG|WebP|attēl|fotogr',text,re.I) else 'upload'
    value=' '.join(a[k] for k in ['data-format','data-period-export','data-export','data-shift-download','data-studio-export'] if a.get(k))
    subject=value+' '+text+' '+a.get('href','')
    for rule in RULES:
        if re.search(rule['pattern'],subject,re.I): return rule['icon']
    if a.get('data-action')=='backup': return 'file-json'
    return 'download' if 'download' in a else None

class Controls(HTMLParser):
    def __init__(self,html):
        super().__init__(convert_charrefs=True); self.html=html;self.stack=[];self.controls=[]
        self.lines=[0]
        for match in re.finditer('\n',html):self.lines.append(match.end())
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for c in self.stack:
            if tag in ['svg','img','picture']:c['hasIcon']=True
            if tag=='input' and a.get('type')=='file':c['fileInput']=True
        if tag in ['button','a','label']:
            line,col=self.getpos();start=self.lines[line-1]+col
            self.stack.append({'tag':tag,'attrs':a,'text':'','hasIcon':False,'fileInput':False,'start':start,'opening':self.get_starttag_text()})
    def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
    def handle_data(self,text):
        for c in self.stack:c['text']+=text
    def handle_endtag(self,tag):
        if self.stack and self.stack[-1]['tag']==tag:self.controls.append(self.stack.pop())

def scan(html):
    parser=Controls(html);parser.feed(html)
    return [(c,classify(c)) for c in parser.controls if classify(c)]

def decorate(html):
    edits=[];added=0
    for c,name in scan(html):
        if c['hasIcon']:continue
        opening=c['opening'];start=c['start'];end=start+len(opening)
        svg=f'<svg class="icon file-action-icon" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'
        match=re.search(r'\bclass\s*=\s*([\'"])(.*?)\1',opening,re.S)
        if match:
            updated=opening[:match.start(2)]+match[2]+' has-file-action-icon'+opening[match.end(2):]
        else:updated=opening[:-1]+' class="has-file-action-icon">'
        edits.extend([(end,end,svg),(start,end,updated)]);added+=1
    for start,end,text in sorted(edits,reverse=True):html=html[:start]+text+html[end:]
    return html,added

def main():
    args=argparse.ArgumentParser();args.add_argument('site');args.add_argument('--audit-only',action='store_true');args.add_argument('--report');opts=args.parse_args()
    report={'pages':0,'controls':0,'added':0,'missing':[]}
    for file in sorted(Path(opts.site).rglob('*.html')):
        html=file.read_text();report['pages']+=1
        if not opts.audit_only:
            html,added=decorate(html);report['added']+=added
            if added:file.write_text(html)
        controls=scan(html);report['controls']+=len(controls)
        for c,name in controls:
            if not c['hasIcon']:report['missing'].append({'page':str(file.relative_to(opts.site)),'text':' '.join(c['text'].split()),'icon':name})
    if opts.report:Path(opts.report).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='missing'}|{'missing':len(report['missing'])}))
    if report['missing']:raise SystemExit(1)
if __name__=='__main__':main()
