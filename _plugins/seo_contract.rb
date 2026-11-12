require_relative '../lib/seo_contract'

Jekyll::Hooks.register :site, :pre_render do |site|
  raise 'Public SEO origin must remain production; use HTTP noindex for local previews' unless site.config.fetch('url')==CalendarSeoContract::ORIGIN
  records=JSON.parse(File.read(File.join(site.source,'docs/route-manifest.json'))).to_h{|r|[r.fetch('url'),r]}
  pages={}
  (site.pages+site.collections.values.flat_map(&:docs)).each do |document|
    next unless %w[default blog-post].include?(document.data['layout'])
    metadata=CalendarSeoContract.page_metadata(document,site,records)
    document.data['seo']=metadata
    pages[document.url]=metadata.reject{|key,_|key=='jsonld'}
  end
  missing=records.keys-pages.keys
  raise "Routes without rendered SEO documents: #{missing.join(', ')}" unless missing.empty?
  File.write(File.join(site.source,'_data/seo-contract.json'),JSON.pretty_generate({schemaVersion:1,origin:CalendarSeoContract::ORIGIN,pages:pages.sort.to_h})+"\n")
end
