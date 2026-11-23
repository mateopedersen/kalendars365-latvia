# Route only the known endpoints and pages that actually render a banner.
require_relative '../lib/advertising_routes'

Jekyll::Hooks.register :site, :post_write, priority: :low do |site|
  download_routes = JSON.parse(File.read(File.join(site.source, 'lib/pdf-canonical-paths.json')))
  AdvertisingRoutes.generate(root: site.source, output: site.dest, existing_routes: ['/api/*', '/horoskops/*', *download_routes])
end
