# Bind the narrow Functions exception to pages that actually render a banner.
require_relative '../lib/advertising_routes'

Jekyll::Hooks.register :site, :post_write, priority: :low do |site|
  AdvertisingRoutes.generate(root: site.source, output: site.dest, existing_routes: ['/api/*', '/horoskops/*'])
end
