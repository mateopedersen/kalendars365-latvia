"""Audit crawlable links in actual article and explanation paragraphs only.

Navigation, footers, related cards and sources do not count as editorial links.
Standard library only; suitable for both local preview and CI builds.
"""
import argparse
import collections
import hashlib
import html.parser
import json
import pathlib
import urllib.parse

class ProseParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[];self.paragraphs=[];self.current=None;self.anchor=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs);classes=set(attrs.get('class','').split())
        mode='article' if 'journal-prose' in classes else 'explanation' if 'page-reading-copy' in classes else None
        if mode is None:mode=self.stack[-1][1] if self.stack else None
        if tag=='p' and mode:
            self.current={'kind':mode,'text':'','links':[]};self.paragraphs.append(self.current)
        if tag=='a' and self.current is not None:
            self.anchor={'href':attrs.get('href',''),'text':'','rel':attrs.get('rel','')};self.current['links'].append(self.anchor)
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):
            self.stack.append((tag,mode))
    def handle_endtag(self,tag):
        if tag=='a':self.anchor=None
        if tag=='p':self.current=None
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:self.stack=self.stack[:i];break
    def handle_data(self,text):
        if self.current is not None:self.current['text']+=text
        if self.anchor is not None:self.anchor['text']+=text

def audit(site):
    pages={};issues=[];incoming=collections.defaultdict(set);tool_incoming=collections.defaultdict(set)
    for f in sorted(site.rglob('*.html')):
        url='/'+f.relative_to(site).as_posix();url=url[:-10] if url.endswith('index.html') else url
        parser=ProseParser();parser.feed(f.read_text());links=[]
        for number,p in enumerate(parser.paragraphs,1):
            seen=set()
            for link in p['links']:
                u=urllib.parse.urlsplit(link['href'])
                if u.netloc and u.netloc not in ('kalendars365.lv','www.kalendars365.lv'):continue
                if not u.path or not u.path.startswith('/'):continue
                target=urllib.parse.unquote(u.path);label=' '.join(link['text'].split())
                item={'url':link['href'],'target':target,'text':label,'paragraph':number,'kind':p['kind'],'context':' '.join(p['text'].split())}
                links.append(item);incoming[target].add(url)
                if not url.startswith('/blogs/') and target.startswith('/blogs/'):tool_incoming[target].add(url)
                path=site/target.lstrip('/');path=path/'index.html' if target.endswith('/') else path
                if not path.is_file():issues.append({'source':url,'type':'missing-target','target':target})
                if target==url:issues.append({'source':url,'type':'self-link','target':target})
                if not label or label.lower() in ('šeit','lasīt vairāk','vairāk','klikšķini šeit','click here','read more'):issues.append({'source':url,'type':'generic-anchor','target':target})
                if 'nofollow' in link['rel'].split():issues.append({'source':url,'type':'nofollow-editorial','target':target})
                if (target,label) in seen:issues.append({'source':url,'type':'repeated-paragraph-link','target':target})
                seen.add((target,label))
        pages[url]={'paragraphs':len(parser.paragraphs),'links':links,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
    articles={url:p for url,p in pages.items() if url.startswith('/blogs/') and url!='/blogs/'}
    for url,p in articles.items():
        links=p['links'];cutoff=max(1,p['paragraphs']//2)
        if not any(x['paragraph']<=cutoff and not x['target'].startswith('/blogs/') for x in links):issues.append({'source':url,'type':'missing-early-tool-link'})
        if not any(x['target'].startswith('/blogs/') for x in links):issues.append({'source':url,'type':'missing-article-context'})
        if not tool_incoming[url]:issues.append({'source':url,'type':'missing-tool-to-article-prose-link'})
    summary={'htmlPages':len(pages),'articlePages':len(articles),'pagesWithProseLinks':sum(bool(x['links'])for x in pages.values()),'articleProseLinks':sum(len(x['links'])for x in articles.values()),'explanationProseLinks':sum(len(p['links'])for u,p in pages.items()if u not in articles),'articlesLinkedFromToolProse':sum(bool(tool_incoming[u])for u in articles),'articlesWithEarlyToolLinks':sum(any(x['paragraph']<=max(1,p['paragraphs']//2)and not x['target'].startswith('/blogs/')for x in p['links'])for p in articles.values()),'issues':len(issues)}
    return {'summary':summary,'issues':issues,'articles':{u:{**p,'incomingProsePages':sorted(incoming[u]),'incomingToolProsePages':sorted(tool_incoming[u])}for u,p in articles.items()},'pages':pages}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--site',type=pathlib.Path,default=pathlib.Path('_site'));ap.add_argument('--output',type=pathlib.Path,required=True);ap.add_argument('--strict',action='store_true');args=ap.parse_args()
    result=audit(args.site);args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result['summary'],ensure_ascii=False));print(json.dumps(result['issues'][:20],ensure_ascii=False))
    raise SystemExit(1 if args.strict and result['issues'] else 0)
