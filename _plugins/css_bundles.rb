# frozen_string_literal: true
require 'digest'
require 'fileutils'
require 'cgi'
require 'uri'
require 'open3'

# Keep the original cascade, but let matching pages reuse one immutable stylesheet.
module CalendarStyleBundles
  TAGS = /<style\b[^>]*>.*?<\/style\s*>|<link\b[^>]*>/mi.freeze
  def self.attributes(tag)
    tag = tag[/\A<[^>]*>/m] || tag
    tag.scan(/([\w:-]+)\s*=\s*(["'])(.*?)\2/m).to_h { |name, _quote, value| [name.downcase, CGI.unescapeHTML(value)] }
  end
  def self.rewrite(html, source)
    bundles = {}
    output = html.sub(/<head\b[^>]*>.*?<\/head\s*>/mi) do |head|
      blocks = {}
      unsafe = false
      head.scan(TAGS).each do |tag|
        attrs = attributes(tag)
        css = nil
        if tag.match?(/\A<style\b/i)
          css = tag.sub(/\A<style\b[^>]*>/mi, '').sub(/<\/style\s*>\z/mi, '')
        elsif attrs.fetch('rel', '').split.include?('stylesheet')
          uri = URI.parse(attrs.fetch('href', ''))
          path = uri.path
          if !uri.scheme && !uri.host && path && path.match?(/\A\/assets\/[\w.\/-]+\.css\z/) && !path.split('/').include?('..') && File.file?(File.join(source, path.delete_prefix('/')))
            css = File.read(File.join(source, path.delete_prefix('/')), encoding: 'UTF-8')
          else
            unsafe = true
          end
        end
        next unless css
        # A relative resource could resolve differently after moving the stylesheet.
        css.scan(/url\(\s*(["']?)(.*?)\1\s*\)/mi).each do |_quote, url|
          unsafe = true unless url.start_with?('/', 'data:', 'https:', 'http:')
        end
        css = "@media #{attrs['media']} {\n#{css}\n}" if attrs['media'] && attrs['media'] != 'all'
        blocks[tag] = css
      end
      next head if unsafe || blocks.empty?
      css = head.scan(TAGS).map { |tag| blocks[tag] }.compact.join("\n")
      path = '/static/css/' + Digest::SHA256.hexdigest(css)[0, 24] + '.css'
      bundles[path] = css
      inserted = false
      head.gsub(TAGS) do |tag|
        next tag unless blocks.key?(tag)
        next '' if inserted
        inserted = true
        %(<link rel="stylesheet" href="#{path}">)
      end
    end
    [output, bundles]
  end
end

if defined?(Jekyll::Hooks)
  [:pages, :documents].each do |owner|
    Jekyll::Hooks.register owner, :post_render do |document|
      next unless document.output_ext == '.html'
      output, bundles = CalendarStyleBundles.rewrite(document.output, document.site.source)
      document.output = output
      store = document.site.instance_variable_get(:@calendar_style_bundles) || {}
      document.site.instance_variable_set(:@calendar_style_bundles, store.merge(bundles))
    end
  end
  Jekyll::Hooks.register :site, :post_write do |site|
    (site.instance_variable_get(:@calendar_style_bundles) || {}).each do |path, css|
      output = File.join(site.dest, path.delete_prefix('/'))
      FileUtils.mkdir_p(File.dirname(output))
      File.write(output, css, encoding: 'UTF-8')
    end
    script = File.join(site.source, 'tooling/critical-css/inline.mjs')
    output, error, status = Open3.capture3(ENV.fetch('NODE', 'node'), script, site.dest)
    abort "Critical CSS build failed: #{error}" unless status.success?
    puts output
  end
end
