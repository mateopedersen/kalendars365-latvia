# SVG <image> elements inside unused symbols still trigger image requests.
# This directory never renders month tiles; keep those assets off its critical path.
module TraditionGuideIcons
  def tradition_guide_icons(svg)
    svg.gsub(/<symbol\b(?=[^>]*\bid="i-month-(?:[1-9]|1[0-2])")[^>]*>.*?<\/symbol>/m, '')
  end
end
Liquid::Template.register_filter(TraditionGuideIcons)
