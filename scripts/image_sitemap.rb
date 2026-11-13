# frozen_string_literal: true

require 'cgi'
require 'json'
require 'set'
require 'uri'
require_relative 'indexing_policy'
require_relative 'sitemap'

module CalendarImageSitemap
  IMAGE_EXTENSION = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)\z/i
  NAMESPACE = 'http://www.google.com/schemas/sitemap-image/1.1'

  # Keep one stable public URL for a versioned image, and never include private
  # uploads, blob/data URLs, fragment symbols, off-site assets or traversal paths.
  def self.local_image(raw, origin:, destination:)
    value = CGI.unescapeHTML(raw.to_s).strip
    return unless value.start_with?('/') || value.start_with?(origin + '/')
    return if value.start_with?('//')

    value = value.delete_prefix(origin)
    path = URI::DEFAULT_PARSER.unescape(value.split(/[?#]/, 2).first)
    return unless path.match?(IMAGE_EXTENSION)
    raise "Unsafe image URL: #{raw}" if path.split('/').include?('..') || path.include?("\0")

    file = File.join(destination, path.delete_prefix('/'))
    raise "Image sitemap points to missing file: #{path}" unless File.file?(file)

    encoded = path.split('/').map { |part| URI.encode_www_form_component(part).gsub('+', '%20') }.join('/')
    origin + encoded
  end

  def self.images_in(markup, origin:, destination:)
    candidates = markup.scan(/\b(?:src|href|xlink:href|poster|data-src)\s*=\s*(["'])(.*?)\1/im).map(&:last)
    markup.scan(/<meta\b[^>]*>/im).each do |tag|
      next unless tag.match?(/\b(?:property|name)=["'](?:og:image|twitter:image)["']/i)
      candidates << tag[/\bcontent=["']([^"']+)["']/i, 1]
    end
    markup.scan(/\bsrcset\s*=\s*(["'])(.*?)\1/im).each do |_quote, srcset|
      next if srcset.strip.start_with?('data:')
      candidates.concat(srcset.split(',').map { |entry| entry.strip.split(/\s+/).first })
    end
    # Real cover photographs also occur in page-specific CSS. Inline symbols
    # and gradients have no separate public image URL and are skipped.
    candidates.concat(markup.scan(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/i).flatten)
    candidates.map { |raw| local_image(raw, origin: origin, destination: destination) }.compact.uniq.sort
  end

  def self.document_images(html, origin:, destination:, css_cache:)
    # Associate each photograph or download with the content that describes it.
    # Repeated navigation artwork, empty-alt decoration and global CSS textures
    # are not content images. Actual image downloads and social covers remain.
    main = html[/<main\b[^>]*>(.*?)<\/main>/im, 1].to_s
    main = main.gsub(/<img\b(?=[^>]*\balt\s*=\s*(["'])\s*\1)[^>]*>/im, '')
    main = main.gsub(/<use\b[^>]*>/im, '')
    social = html.scan(/<meta\b[^>]*>/im).select do |tag|
      tag.match?(/\b(?:property|name)=["'](?:og:image|twitter:image)["']/i)
    end.join
    images_in(main + social, origin: origin, destination: destination)
  end

  def self.write!(site)
    origin = site.config.fetch('url').sub(%r{/\z}, '')
    raise 'Sitemaps require the public HTTPS origin' unless origin == 'https://kalendars365.lv'

    robots = File.read(File.join(site.dest, 'robots.txt'))
    raise 'robots.txt blocks public content' if robots.match?(/^Disallow:\s*\S+/i)
    headers = File.read(File.join(site.dest, '_headers'))
    header_path = nil
    headers.each_line do |line|
      header_path = line.strip if line.start_with?('/')
      next unless line.match?(/^\s+X-Robots-Tag:\s*[^\n]*(?:noindex|noimageindex|none)/i)
      raise "Response headers block public content: #{header_path}" unless CalendarIndexingPolicy.noindex?(header_path)
    end

    css_cache = {}
    records = []
    documents = site.pages + site.collections.values.flat_map(&:docs)
    documents.each do |document|
      next unless %w[default blog-post].include?(document.data['layout'])
      CalendarIndexingPolicy.validate!(document.url, document.data['noindex'])
      next if CalendarIndexingPolicy.noindex?(document.url)

      html = File.read(document.destination(site.dest), encoding: 'UTF-8')
      robots = html.scan(/<meta\b(?=[^>]*\bname=["'](?:robots|googlebot|googlebot-image)["'])[^>]*>/i).join
      raise "Blocked indexable content: #{document.url}" if robots.match?(/\b(?:noindex|noimageindex|nofollow|none)\b/i)
      canonical = CGI.unescapeHTML(html[/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["']/i, 1].to_s)
      raise "Incorrect canonical: #{document.url}" unless URI::DEFAULT_PARSER.unescape(canonical) == origin + document.url

      images = document_images(html, origin: origin, destination: site.dest, css_cache: css_cache)
      if document.url == '/'
        # The city picker presents these reviewed photographs dynamically.
        # Associate them with the actual homepage rather than the noindex credits page.
        city_photos=site.data.fetch('cities').fetch('cities').flat_map do |city|
          [city.dig('photo','src'),city.dig('nightPhoto','src')].compact
        end
        images=(images+city_photos.map { |path|local_image(path,origin:origin,destination:site.dest) }).compact.uniq.sort
      end
      raise "Too many images for a sitemap URL: #{document.url}" if images.length > 1000
      records << {url: document.url, images: images}
    end

    records.sort_by! { |row| row[:url] }
    raise 'Image sitemap exceeds 50,000 URLs' if records.length > CalendarSitemap::MAX_URLS
    xml = String.new(%(<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="#{NAMESPACE}">\n))
    records.each do |row|
      xml << "<url><loc>#{CGI.escapeHTML(CalendarSitemap.absolute(row[:url]))}</loc>"
      row[:images].each { |image| xml << "<image:image><image:loc>#{CGI.escapeHTML(image)}</image:loc></image:image>" }
      xml << "</url>\n"
    end
    xml << "</urlset>\n"
    raise 'Image sitemap exceeds 50 MB' if xml.bytesize > 50 * 1024 * 1024
    File.write(File.join(site.dest, 'image-sitemap.xml'), xml)

    public_images = site.static_files.select { |file| file.path.match?(IMAGE_EXTENSION) }
    summary = {
      schemaVersion: 1, contentPages: records.length, excludedPage: CalendarIndexingPolicy::PHOTO_LICENSE_URL,
      errorDocuments: CalendarIndexingPolicy::ERROR_URLS, publicImageFiles: public_images.length,
      sitemapImages: records.flat_map { |row| row[:images] }.uniq.length,
      imageReferences: records.sum { |row| row[:images].length }, imageSitemapBytes: xml.bytesize,
      pages: records.map { |row| {url: row[:url], images: row[:images].length} }
    }
    File.write(File.join(site.source, 'docs/indexability-audit.json'), JSON.pretty_generate(summary) + "\n")
    Jekyll.logger.info 'Indexability:', "#{records.length} content pages; #{summary[:sitemapImages]} images in image sitemap"
  end
end
