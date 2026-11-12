require_relative '../scripts/image_sitemap'

Jekyll::Hooks.register :site, :pre_render do |site|
  (site.pages + site.collections.values.flat_map(&:docs)).each do |document|
    next unless %w[default blog-post].include?(document.data['layout'])
    CalendarIndexingPolicy.validate!(document.url, document.data['noindex'])
  end
end

# Image references in CSS must be read after immutable bundles and critical CSS
# have been written; plugin filesystem load order is not a dependency contract.
Jekyll::Hooks.register :site, :post_write, priority: :low do |site|
  CalendarImageSitemap.write!(site)
  CalendarSitemap.validate_build!(site)
end
