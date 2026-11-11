# Page-bound social covers: refuse missing, stale or duplicate image assignments.
require 'json'
require 'digest'
module CalendarSocialImages
  def self.validate(site)
    file = File.join(site.source, '_data/social-images.json')
    raise 'Build social covers first: see tooling/social-cards/README.md' unless File.file?(file)
    catalog = JSON.parse(File.read(file, encoding: 'UTF-8'))
    raise 'Social renderer changed; rebuild covers' unless catalog.fetch('rendererSha256') == Digest::SHA256.file(File.join(site.source, 'scripts/social_images.py')).hexdigest
    raise 'Social preparation changed; rebuild covers' unless catalog.fetch('prepareSha256') == Digest::SHA256.file(File.join(site.source, 'tooling/social-cards/prepare.mjs')).hexdigest
    rows = catalog.fetch('pages')
    seen = {}
    input_hashes = {}
    rows.each do |url, row|
      raise "Invalid social cover #{url}" unless row['url'] == url && row['width'] == 1200 && row['height'] == 630 && row['type'] == 'image/jpeg'
      raise "Duplicate social cover #{url}" if seen[row.fetch('src')]
      seen[row.fetch('src')] = true
      path = row.fetch('src')
      raise 'Unsafe social cover path' unless path.match?(%r{\A/assets/social-cards/v2/[a-f0-9]{16}-[a-f0-9]{12}\.jpg\z})
      local = File.join(site.source, path.delete_prefix('/'))
      raise "Missing or replaced social cover #{url}" unless File.file?(local) && Digest::SHA256.file(local).hexdigest == row.fetch('sha256')
      row.fetch('inputs').each do |input, expected|
        raise 'Unsafe social input path' unless input.start_with?('/assets/') && !input.split('/').include?('..')
        input_hashes[input] ||= Digest::SHA256.file(File.join(site.source, input.delete_prefix('/'))).hexdigest
        raise "Social source changed: #{input}; rebuild social covers" unless input_hashes[input] == expected
      end
    end
    documents = site.pages + site.collections.values.flat_map(&:docs)
    documents.each do |document|
      next unless %w[default blog-post].include?(document.data['layout'])
      row = rows[document.url]
      raise "No individual social cover for #{document.url}" unless row
      raise "Social title changed: #{document.url}; rebuild social covers" unless document.data['title'] == row['title']
    end
    site.config['social_cover_count'] = rows.length
  end
end
Jekyll::Hooks.register :site, :pre_render do |site|
  CalendarSocialImages.validate(site)
end
