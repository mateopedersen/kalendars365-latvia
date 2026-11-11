# frozen_string_literal: true
require 'json'
require 'cgi'
module PreviewComponents
  PREVIEWS = JSON.parse(File.read(File.expand_path('../_data/preview-images.json', __dir__))).fetch('images').freeze
  def preview_image(item, alt:, loading: 'lazy', priority: false)
    photo = PREVIEWS.fetch(item.fetch('preview'))
    portrait = photo.fetch('height') > photo.fetch('width')
    sizes = portrait ? '(max-width: 360px) 190px, 220px' : '(max-width: 650px) calc(100vw - 68px), (max-width: 1100px) 40vw, 300px'
    escape = ->(value) { CGI.escapeHTML(value.to_s) }
    %(<img src="#{escape.call(photo.fetch('src'))}" srcset="#{escape.call(photo.fetch('srcset'))}" sizes="#{sizes}" width="#{photo.fetch('width')}" height="#{photo.fetch('height')}" loading="#{loading}" decoding="async"#{priority ? ' fetchpriority="high"' : ''} alt="#{escape.call(alt)}">)
  end
end
