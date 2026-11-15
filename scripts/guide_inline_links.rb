# frozen_string_literal: true
require 'json'
require 'cgi'
require 'uri'

# Explicit, reviewed anchors only; never substring-link every mention of a keyword.
module GuideInlineLinks
  DATA = JSON.parse(File.read(File.expand_path('../_data/guide-inline-links.json', __dir__)))
  ROUTES = JSON.parse(File.read(File.expand_path('../_data/routes.json', __dir__))).map { |r| r.fetch('URL path') }
  module_function
  def render(text, route, section)
    rules=DATA.fetch(route,[]).select { |r| r.fetch('section') == section }
    intervals=rules.map do |rule|
      anchor=rule.fetch('text');match=/(?<![[:alnum:]])#{Regexp.escape(anchor)}(?![[:alnum:]])/.match(text);start=match&.begin(0)
      raise "Missing reviewed link anchor #{route}: #{anchor}" unless start
      url=rule.fetch('url')
      if url.start_with?('/')
        raise "Invalid guide destination #{route}: #{url}" unless url!=route && ROUTES.include?(url.split('#').first)
      else
        raise "Invalid external guide source #{url}" unless URI(url).scheme=='https'
      end
      [start,start+anchor.length,anchor,url]
    end.sort_by(&:first)
    previous=0;output=''
    intervals.each do |start,finish,anchor,url|
      raise "Overlapping guide links #{route}" if start<previous
      output+=CGI.escapeHTML(text[previous...start])
      output+=%(<a href="#{CGI.escapeHTML(url)}"#{url.start_with?('https://') ? ' rel="noopener"' : ''}>#{CGI.escapeHTML(anchor)}</a>)
      previous=finish
    end
    output+CGI.escapeHTML(text[previous..])
  end
end
