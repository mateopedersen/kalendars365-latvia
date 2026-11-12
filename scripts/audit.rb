# frozen_string_literal: true
require 'json'
require 'csv'
require 'uri'
require 'cgi'
require 'set'
require_relative 'indexing_policy'
root=File.expand_path('..',__dir__);Dir.chdir(root)
manifest=JSON.parse(File.read('docs/route-manifest.json'))
errors=[];rows=[];titles={};descs={};allfiles=Dir.glob('_site/**/*').select{|p|File.file?(p)}
manifest.each do |r|
 path=r['url']=='/' ? '_site/index.html' : "_site#{r['url']}index.html"
 unless File.file?(path);errors << "missing #{path}";next;end
 html=File.read(path);faults=[]
 faults << 'missing Latvian lang' unless html.include?('<html lang="lv">')
 faults << 'H1 count !=1' unless html.scan(/<h1(?:\s|>)/).length==1
 title=html[/<title>(.*?)<\/title>/m,1];description=html[/<meta name="description" content="([^"]*)"/,1]
 faults << 'missing title' if title.nil?||title.empty?
 faults << 'duplicate title' if titles.key?(title);titles[title]=r['url']
 faults << 'missing description' if description.nil?||description.empty?
 faults << 'duplicate description' if descs.key?(description);descs[description]=r['url']
 canonical=html[/<link rel="canonical" href="([^"]+)"/,1]; faults << 'missing canonical' unless canonical && URI::DEFAULT_PARSER.unescape(CGI.unescapeHTML(canonical))=="https://kalendars365.lv#{r['url']}"
 robots=html[/<meta name="robots" content="([^"]+)"/,1].to_s.split(',').map(&:strip)
 faults << 'index mismatch' unless robots.include?('noindex')==!r['indexable']
 faults << 'unexpected content exclusion' unless r['indexable']==!CalendarIndexingPolicy.noindex?(r['url'])
 faults << 'image indexing blocked' if robots.include?('noimageindex')
 faults << 'large image previews missing' if r['indexable'] && !robots.include?('max-image-preview:large')
 html.scan(/<script type="application\/ld\+json">(.*?)<\/script>/m).flatten.each{|j|begin;JSON.parse(j);rescue;faults << 'invalid JSONLD';end}
 html.scan(/<img\b[^>]*>/mi).each do |image|
  src=image[/\bsrc\s*=\s*(["'])(.*?)\1/m,2]
  # An absent source can be a hidden upload preview; an empty URL must never
  # be emitted as a static photo derivative.
  faults << 'empty image source' if src && CGI.unescapeHTML(src).strip.empty?
 end
 html.scan(/(?:href|src)="([^"]+)"/).flatten.each do |raw|
  target=CGI.unescapeHTML(raw.split(/[?#]/).first.to_s)
  next if target.empty? || !target.start_with?('/') || target.start_with?('//')
  target=URI::DEFAULT_PARSER.unescape(target)
  candidates=["_site#{target}","_site#{target}index.html","_site#{target}/index.html"]
  faults << "missing internal #{target}" unless candidates.any?{|c|File.file?(c)}
 end
 rows<<[r['url'],r['family'],r['indexable'],faults.empty? ? 'pass' : 'fail',faults.uniq.join('; ')]
 errors.concat(faults.map{|x|"#{r['url']}: #{x}"})
end
%w[_headers _redirects].each do |file|
 errors << "missing Cloudflare configuration #{file}" unless File.file?("_site/#{file}")
end
if File.file?('_site/_headers')
 headers=File.read('_site/_headers')
 errors << 'missing CSP policy' unless headers.include?("Content-Security-Policy: default-src 'self'")
end
xml=File.read('_site/sitemap.xml');locs=xml.scan(/<loc>(.*?)<\/loc>/).flatten.map { |url| URI::DEFAULT_PARSER.unescape(CGI.unescapeHTML(url)) }
expected=manifest.select{|r|r['indexable']}.map{|r|'https://kalendars365.lv'+r['url']}
errors << 'sitemap differs' unless locs.sort==expected.sort
robots=File.read('_site/robots.txt')
errors << 'robots blocks public crawling' if robots.match?(/^Disallow:\s*\S+/i)
errors << 'image sitemap not advertised' unless robots.include?('Sitemap: https://kalendars365.lv/image-sitemap.xml')
errors << 'missing image sitemap' unless File.file?('_site/image-sitemap.xml')
search_rows=JSON.parse(File.read('assets/search-index.json'))
search_rows.each do |entry|
  target=URI::DEFAULT_PARSER.unescape(entry.fetch('url').split(/[?#]/).first)
  next unless target.start_with?('/')
  candidates=["_site#{target}","_site#{target}index.html","_site#{target}/index.html"]
  errors << "search points to missing page: #{target}" unless candidates.any?{|file|File.file?(file)}
end
errors << 'Cloudflare file limit' if allfiles.length>20_000
oversized=allfiles.select{|p|File.size(p)>25*1024*1024};errors.concat(oversized.map{|p|"oversized asset: #{p}"})
CSV.open('docs/SEO_AUDIT.csv','w'){|csv|csv<<%w[url family indexable result errors];rows.each{|r|csv<<r}}
summary={matrix_routes:manifest.length,html_files:allfiles.count{|p|p.end_with?('.html')},search_entries:search_rows.length,indexable:expected.length,noindex:manifest.length-expected.length,total_files:allfiles.length,total_bytes:allfiles.sum{|p|File.size(p)},errors:errors.uniq}
File.write('docs/site-audit.json',JSON.pretty_generate(summary));puts JSON.pretty_generate(summary.merge(errors:errors.uniq.first(35)));exit(errors.empty? ? 0 : 1)
