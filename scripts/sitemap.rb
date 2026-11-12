# frozen_string_literal: true

require 'cgi'
require 'date'
require 'json'
require 'open3'
require 'uri'
require_relative '../lib/seo_contract'
require_relative 'indexing_policy'

# One canonical registry drives both discovery documents. No clock-based lastmod,
# search parameters, alternate format copies or private browser data are added.
module CalendarSitemap
  NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'
  MAX_URLS = 50_000
  MAX_BYTES = 50 * 1024 * 1024
  FILES = %w[sitemap.xml image-sitemap.xml].freeze
  module_function

  def absolute(path)
    canonical = CalendarSeoContract.canonical_path(path)
    # Escape UTF-8 bytes, preserving path delimiters; the Latvian URL itself stays
    # unchanged. Reject already encoded aliases instead of double escaping them.
    raise "Encoded canonical alias: #{path}" if canonical.include?('%')
    url = CalendarSeoContract::ORIGIN + URI::DEFAULT_PARSER.escape(canonical, /[^A-Za-z0-9\-._~\/]/)
    raise "Sitemap URL is too long: #{path}" if url.length >= 2048
    url
  end

  def page_xml(manifest, today: Date.today)
    seen = {}
    records = manifest.map do |raw|
      row = raw.transform_keys(&:to_s)
      path = row.fetch('canonicalPath')
      raise "Route and canonical disagree: #{path}" unless path == row.fetch('url')
      raise "Duplicate sitemap route: #{path}" if seen[path]
      seen[path] = true
      raise "Indexability must be boolean: #{path}" unless [true, false].include?(row.fetch('indexable'))
      CalendarIndexingPolicy.validate!(path, !row['indexable'])
      url = absolute(path)
      modified = CalendarSeoContract.date(row.fetch('significantModifiedAt'))
      raise "Revision dates disagree: #{path}" unless modified == CalendarSeoContract.date(row.fetch('lastmod'))
      raise "Future sitemap modification: #{path}" if Date.iso8601(modified) > today
      {path: path, url: url, lastmod: modified, indexable: row['indexable']}
    end.select { |row| row[:indexable] }.sort_by { |row| row[:path] }
    raise 'Page sitemap must contain public pages' if records.empty?
    raise 'Page sitemap exceeds 50,000 URLs; split before publication' if records.length > MAX_URLS

    xml = +%(<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="#{NAMESPACE}">\n)
    records.each do |row|
      xml << "  <url><loc>#{CGI.escapeHTML(row[:url])}</loc><lastmod>#{row[:lastmod]}</lastmod></url>\n"
    end
    xml << "</urlset>\n"
    raise 'Page sitemap exceeds 50 MB; split before publication' if xml.bytesize > MAX_BYTES
    xml
  end

  def write_source!(manifest, source: '.')
    File.write(File.join(source, 'sitemap.xml'), "---\nlayout: null\n---\n" + page_xml(manifest))
    robots = +"---\nlayout: null\n---\nUser-agent: *\nAllow: /\n"
    FILES.each { |name| robots << "Sitemap: {{ site.url }}/#{name}\n" }
    File.write(File.join(source, 'robots.txt'), robots)
  end

  def validate_build!(site)
    # Python's standard XML parser is independent of the serializer. The project
    # already requires Python 3 for asset preparation; no network access occurs.
    script = File.join(site.source, 'scripts/audit_sitemaps.py')
    output, error, status = Open3.capture3('python3', script, '--site', site.dest, '--source', site.source,
      '--output', File.join(site.source, 'docs/sitemap-audit.json'))
    raise "Sitemap verification failed:\n#{output}\n#{error}" unless status.success?
    summary = JSON.parse(output)
    Jekyll.logger.info 'Sitemaps:', "#{summary.fetch('pageUrls')} pages; #{summary.fetch('uniqueImages')} images; XML and canonical coverage verified"
  end
end
