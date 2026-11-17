require_relative '../lib/advertising_placement'
module CalendarAdvertisingPlacement
  def advertising_after_intro(content, markup, secondary = "")
    AdvertisingPlacement.secondary(AdvertisingPlacement.after_intro(content.to_s, markup.to_s), secondary.to_s)
  end
end
Liquid::Template.register_filter(CalendarAdvertisingPlacement)
