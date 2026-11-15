# frozen_string_literal: true
require 'json'
require 'cgi'
require 'date'
require_relative 'event_guides'

module UpcomingEvents
  module_function
  def records
    entries=EventGuides::GUIDES.reject { |g| g['pending'] }.map do |g|
      p=EventGuides.photo(g)
      {id:g.fetch('slug'),title:g.fetch('title'),url:g.fetch('url'),start:g.fetch('start'),end:g['end']||g.fetch('start'),city:g.fetch('city'),place:g.fetch('place'),schedule:g.fetch('time'),summary:g.fetch('intro'),image:p.fetch('src'),imageAlt:p.fetch('alt'),imageCaption:p.fetch('caption'),imageWidth:p.fetch('width'),imageHeight:p.fetch('height'),source:g.fetch('sources').first.fetch('url')}
    end
    staro=JSON.parse(File.read('_data/staro-riga.json'));p=staro.fetch('galleryPhoto')
    entries << {id:'staro-riga',title:'Staro Rīga 2026',url:'/svetki-un-tradicijas/staro-riga/',start:staro.fetch('startDate'),end:staro.fetch('endDate'),endTime:staro.fetch('endTime'),city:'Rīga',place:'Gaismas objekti Rīgā',schedule:"Katru vakaru #{staro.fetch('startTime')}–#{staro.fetch('endTime')}",summary:'Gaismas festivāls Rīgā. Atver objektu karti un izvēlies savu vakara pastaigu.',image:p.fetch('src'),imageAlt:p.fetch('alt'),imageCaption:p.fetch('caption'),imageWidth:p.fetch('width'),imageHeight:p.fetch('height'),source:staro.fetch('programmeUrl')}
    entries.sort_by { |g| [g[:start],g[:id]] }
  end
  def write
    entries=records;day=Date.today.iso8601
    selected=entries.select { |g| g[:end]>=day }.sort_by { |g| [g[:start]<=day ? 0 : 1,g[:start],g[:end],g[:id]] }.first(4)
    payload={schemaVersion:1,timeZone:'Europe/Riga',events:entries}
    File.write('assets/upcoming-events.json',JSON.generate(payload))
    File.write('_data/upcoming-events.json',JSON.pretty_generate(payload.merge(today:day,initial:selected))+"\n")
  end
end
