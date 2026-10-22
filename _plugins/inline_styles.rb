# Inline the small shared CSS bundle to remove render-blocking network trips.
module CalendarInlineStyles
  def inline_styles(names)
    site = @context.registers[:site]
    names.split(',').map do |name|
      raise ArgumentError, 'Unknown stylesheet' unless %w[style.css pages.css typography.css].include?(name)
      File.read(File.join(site.source, 'assets', name), encoding: 'UTF-8')
    end.join("\n")
  end
end
Liquid::Template.register_filter(CalendarInlineStyles)
