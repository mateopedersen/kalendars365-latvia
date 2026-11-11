"""Audit the actual generated HTML link graph, including fragments and redirect hops.

Uses only Python's standard library. Optional --http verifies every HTML route on
the running local preview, not just the source files. No JavaScript or user forms.
"""
import argparse
import collections
import concurrent.futures
import html.parser
import json
import hashlib
import pathlib
import re
import time
import urllib.parse
import urllib.error
import urllib.request

ORIGIN = 'https://kalendars365.lv'
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())


class PageParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = set()
        self.links = []
        self.current = None
        self.robots = ''
        self.canonical = ''
        self.title = ''

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.robots = attrs.get('content', '')
        if tag == 'link' and 'canonical' in attrs.get('rel', '').split():
            self.canonical = attrs.get('href', '')
        if tag == 'a' and 'href' in attrs:
            contexts = [(t, a.get('class', '').split(), a.get('id', '')) for t, a in self.stack]
            area = 'content'
            if any('site-header' in c for _, c, _ in contexts):
                area = 'header'
            elif any(t == 'footer' or i == 'site-footer' for t, _, i in contexts):
                area = 'footer'
            elif any(i in ('consent-banner', 'universal-dialog') for _, _, i in contexts):
                area = 'interface'
            elif any('breadcrumbs' in c for _, c, _ in contexts):
                area = 'breadcrumb'
            elif any('internal-navigation' in c for _, c, _ in contexts):
                area = 'context-navigation'
            elif any('related-links' in c for _, c, _ in contexts):
                area = 'shared-related'
            elif any('page-reading-related' in c for _, c, _ in contexts):
                area = 'reading-related'
            self.current = {'href': attrs['href'], 'text': '', 'ariaLabel': attrs.get('aria-label', ''),
                            'rel': attrs.get('rel', ''), 'area': area}
            self.links.append(self.current)
        if tag == 'img' and self.current and attrs.get('alt'):
            self.current['text'] += ' ' + attrs['alt']
        if tag not in VOID:
            self.stack.append((tag, attrs))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == 'a':
            self.current = None
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, text):
        if self.stack and self.stack[-1][0] == 'title':
            self.title += text
        if self.current and not any(t in ('svg', 'script', 'style') or a.get('aria-hidden') == 'true' for t, a in self.stack):
            self.current['text'] += text


def page_url(path, root):
    value = '/' + path.relative_to(root).as_posix()
    return value[:-10] if value.endswith('index.html') else value


def local_target(source, href):
    parsed = urllib.parse.urlsplit(urllib.parse.urljoin(ORIGIN + source, href))
    if parsed.scheme not in ('https', 'http') or parsed.netloc not in ('kalendars365.lv', 'www.kalendars365.lv'):
        return None
    path = urllib.parse.unquote(parsed.path)
    if path.endswith('/index.html'):
        path = path[:-10]
    if not pathlib.PurePosixPath(path).suffix and not path.endswith('/'):
        path += '/'
    return path, urllib.parse.unquote(parsed.fragment), parsed.query


def audit(root, base=None):
    pages = {}
    for path in sorted(root.rglob('*.html')):
        parser = PageParser()
        document = path.read_text(encoding='utf-8')
        parser.feed(document)
        parser.sha256 = hashlib.sha256(document.encode('utf-8')).hexdigest()
        pages[page_url(path, root)] = parser
    indexed = {url for url, page in pages.items() if 'noindex' not in page.robots.lower()}
    incoming = {u: set() for u in indexed}
    contextual = {u: set() for u in indexed}
    graph = collections.defaultdict(set)
    context_graph = collections.defaultdict(set)
    broken, fragments, empty, generic, redirect_links = [], [], [], [], []
    self_links = 0
    counts = collections.Counter()
    redirects = {}
    redirect_file = root / '_redirects'
    if redirect_file.exists():
        for line in redirect_file.read_text().splitlines():
            items = line.split()
            if len(items) >= 3 and items[2].startswith('30') and '*' not in items[0]:
                redirects[items[0]] = items[1]
    for source, page in pages.items():
        for link in page.links:
            counts[link['area']] += 1
            target = local_target(source, link['href'])
            if not target:
                continue
            path, fragment, query = target
            if path not in pages and path in redirects:
                resolved = local_target(source, redirects[path])
                if resolved:
                    redirect_links.append({'source': source, 'href': link['href'], 'target': resolved[0]})
                    path, fragment, query = resolved
            if path in pages:
                label = re.sub(r'\s+', ' ', link['text']).strip() or link['ariaLabel'].strip()
                if not label:
                    empty.append({'source': source, 'target': path, 'area': link['area']})
                if re.fullmatch(r'(?:vairāk|lasīt vairāk|lasīt|skatīt|atvērt|šeit|uzzināt vairāk|more|read more)[\s↗→↓]*', label, re.I):
                    generic.append({'source': source, 'target': path, 'label': label, 'area': link['area']})
                if fragment and fragment not in pages[path].ids:
                    fragments.append({'source': source, 'target': path, 'fragment': fragment, 'area': link['area']})
                if source == path:
                    self_links += 1
                    continue
                if source in indexed and path in indexed and 'nofollow' not in link['rel'].split():
                    incoming[path].add(source)
                    graph[source].add(path)
                    if link['area'] not in ('header', 'footer', 'breadcrumb', 'shared-related', 'interface'):
                        contextual[path].add(source)
                        context_graph[source].add(path)
            elif not (path.startswith(('/api/', '/cdn-cgi/')) or (root / path.lstrip('/')).is_file()):
                broken.append({'source': source, 'href': link['href'], 'target': path, 'area': link['area']})
    def distances(edges):
        distance, queue = {'/': 0}, collections.deque(['/'])
        while queue:
            current = queue.popleft()
            for target in edges[current]:
                if target not in distance:
                    distance[target] = distance[current] + 1
                    queue.append(target)
        return distance
    depth = distances(graph)
    content_depth = distances(context_graph)
    summary = {'htmlPages': len(pages), 'indexablePages': len(indexed), 'linkOccurrences': sum(counts.values()),
               'linkAreas': dict(counts), 'brokenLinks': len(broken), 'missingFragments': len(fragments),
               'redirectLinks': len(redirect_links), 'emptyAnchors': len(empty), 'genericAnchors': len(generic),
               'selfLinks': self_links, 'orphanIndexablePages': len([u for u in indexed if u != '/' and not incoming[u]]),
               'noContextualIncoming': len([u for u in indexed if u != '/' and not contextual[u]]),
               'unreachableFromHome': len(indexed - set(depth)),
               'maxClickDepth': max(depth.values(), default=0), 'clickDepthHistogram': dict(collections.Counter(depth.values())),
               'contextualMaxDepth': max(content_depth.values(), default=0),
               'contextualUnreachable': len(indexed - set(content_depth))}
    if base:
        def request(url):
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(base.rstrip('/') + urllib.parse.quote(url), timeout=25) as response:
                        body = response.read()
                        return {'url': url, 'status': response.status, 'html': b'<html' in body.lower(), 'bytes': len(body), 'attempts': attempt + 1}
                except urllib.error.HTTPError as error:
                    return {'url': url, 'status': error.code, 'error': str(error), 'attempts': attempt + 1}
                except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as error:
                    if attempt == 2:
                        return {'url': url, 'error': str(error), 'attempts': attempt + 1}
                    time.sleep(0.15 * (attempt + 1))
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            http = list(pool.map(request, pages))
        summary['httpPagesChecked'] = len(http)
        summary['httpRetriedPages'] = sum(r.get('attempts', 1) > 1 for r in http)
        summary['httpFailures'] = [r for r in http if r.get('status') != 200 or not r.get('html')]
    rows = [{'url': u, 'title': pages[u].title.replace(' | Kalendārs365', ''), 'indexable': u in indexed, 'sha256': pages[u].sha256,
             'incomingPages': len(incoming.get(u, [])), 'contextualIncomingPages': len(contextual.get(u, [])),
             'depth': depth.get(u), 'contextualDepth': content_depth.get(u),
             'outgoingIndexable': len(graph[u]), 'contextualOutgoing': len(context_graph[u])} for u in pages]
    return {'summary': summary, 'pages': rows, 'brokenLinks': broken, 'missingFragments': fragments,
            'redirectLinks': redirect_links, 'emptyAnchors': empty, 'genericAnchors': generic,
            'edges': {url: sorted(values) for url, values in graph.items()},
            'contextualEdges': {url: sorted(values) for url, values in context_graph.items()}}


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--site', default='_site')
    cli.add_argument('--output', required=True)
    cli.add_argument('--http', help='Local preview origin; checks every generated HTML page')
    cli.add_argument('--strict', action='store_true', help='Fail on broken links/fragments or undiscoverable indexable pages')
    args = cli.parse_args()
    data = audit(pathlib.Path(args.site).resolve(), args.http)
    path = pathlib.Path(args.output); path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(data['summary'], ensure_ascii=False))
    if args.strict and any(data['summary'].get(key) for key in ('brokenLinks','missingFragments','orphanIndexablePages','noContextualIncoming','unreachableFromHome','contextualUnreachable','emptyAnchors','redirectLinks','httpFailures')):
        raise SystemExit(1)
