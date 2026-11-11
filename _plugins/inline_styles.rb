# Inline the small shared CSS bundle to remove render-blocking network trips.
module CalendarInlineStyles
  def inline_styles(names)
    site = @context.registers[:site]
    names.split(',').map do |name|
      raise ArgumentError, 'Unknown stylesheet' unless %w[style.css pages.css typography.css experience.css sky.css garden.css horoscope.css organizers.css extra-tools.css universities.css lunar.css a3-gallery.css search.css visual-polish.css city-card-redesign.css calendar-print.css hub-pages.css school.css work-calendar.css garden-experience.css category-experience.css category-redesign.css consent.css layout-stability.css calendar-collection.css footer.css page-reading.css blog.css].include?(name)
      File.read(File.join(site.source, 'assets', name), encoding: 'UTF-8')
    end.join("\n")
  end
end
Liquid::Template.register_filter(CalendarInlineStyles)
