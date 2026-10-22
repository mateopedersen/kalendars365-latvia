# frozen_string_literal: true
require 'json'
require 'csv'
require 'uri'
require 'cgi'
require 'set'
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
 noindex=html.include?('content="noindex,follow"');faults << 'index mismatch' if noindex==r['indexable']
 html.scan(/<script type="application\/ld\+json">(.*?)<\/script>/m).flatten.each{|j|begin;JSON.parse(j);rescue;faults << 'invalid JSONLD';end}
 html.scan(/(?:href|src)="([^"]+)"/).flatten.each do |raw|
  target=CGI.unescapeHTML(raw.split(/[?#]/).first.to_s)
  next if target.empty? || !target.start_with?('/') || target.start_with?('//')
  target=URI::DEFAULT_PARSER.unescape(target)
  candidates=["_site#{target}","_site#{target}index.html","_site#{target}/index.html"]
  next if target.start_with?('/nedelas-kalendars/2026/')||target.start_with?('/nedelas-kalendars/2031/')
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
xml=File.read('_site/sitemap.xml');locs=xml.scan(/<loc>(.*?)<\/loc>/).flatten
expected=manifest.select{|r|r['indexable']}.map{|r|'https://kalendars365.lv'+r['url']}
errors << 'sitemap differs' unless locs.sort==expected.sort
errors << 'Cloudflare file limit' if allfiles.length>20_000
oversized=allfiles.select{|p|File.size(p)>25*1024*1024};errors.concat(oversized.map{|p|"oversized asset: #{p}"})
CSV.open('docs/SEO_AUDIT.csv','w'){|csv|csv<<%w[url family indexable result errors];rows.each{|r|csv<<r}}
summary={matrix_routes:manifest.length,html_files:allfiles.count{|p|p.end_with?('.html')},indexable:expected.length,noindex:manifest.length-expected.length,total_files:allfiles.length,total_bytes:allfiles.sum{|p|File.size(p)},errors:errors.uniq}
File.write('docs/site-audit.json',JSON.pretty_generate(summary));puts JSON.pretty_generate(summary.merge(errors:errors.uniq.first(35)));exit(errors.empty? ? 0 : 1)
