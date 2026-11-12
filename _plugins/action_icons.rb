require 'open3'
Jekyll::Hooks.register :site, :post_write do |site|
  script=File.join(site.source,'scripts/render_action_icons.py')
  report=File.join(site.source,'docs/action-icons-audit.json')
  output,error,status=Open3.capture3('python3',script,site.dest,'--report',report)
  abort "Action icon rendering failed: #{error}" unless status.success?
  puts output
end
