# frozen_string_literal: true
require 'json'
require 'uri'
require 'date'

# Curated relationships and reader-facing sources for the entire topic directory.
# A missing topic or destination fails the build instead of silently falling back
# to an unrelated, alphabetically selected article.
class TraditionLinks
  PREFIX = '/svetki-un-tradicijas/'
  attr_reader :topics, :entries

  def initialize(entries:, occasions:, cultural:, routes:)
    @entries = entries.fetch('topics')
    @illustrations = JSON.parse(File.read('_data/tradition-illustrations.json'))
    @photos = JSON.parse(File.read('_data/tradition-photos.json')).fetch('photos').to_h { |photo| [photo.fetch('slug'),photo] }
    overrides_file='_data/occasion-photo-overrides.json'
    @photo_overrides=File.file?(overrides_file) ? JSON.parse(File.read(overrides_file)).fetch('photos').to_h { |photo| [photo.fetch('slug'),photo] } : {}
    @routes = routes.map { |route| route.fetch('URL path') }
    @topics = occasions.to_h do |item|
      [item.fetch('slug'), item.merge('url'=>PREFIX+item.fetch('slug')+'/', 'label'=>item.fetch('title'), 'photo'=>@photo_overrides.fetch(item.fetch('slug'),item.fetch('photo')))]
    end
    cultural.each do |item|
      slug = item.fetch('url').split('/').last
      raise "Duplicate tradition topic: #{slug}" if @topics.key?(slug)
      @topics[slug] = item.merge('slug'=>slug, 'label'=>item.fetch('h1').split(':').first, 'type'=>'culture', 'illustration'=>@illustrations.fetch(slug), 'photo'=>@photos.fetch(slug))
    end
    expected_art = cultural.map { |item| item.fetch('url').split('/').last }.sort
    raise 'Unknown occasion photo override' unless (@photo_overrides.keys-occasions.map{|item|item.fetch('slug')}).empty?
    raise 'Cultural photo coverage differs from catalog' unless @photos.keys.sort == expected_art
    @photos.each do |slug, photo|
      raise "Missing licensed topic photo: #{slug}" unless File.file?(photo.fetch('sourceCopy')) && photo.fetch('licenseUrl').start_with?('https://','http://') && !photo.fetch('author').empty? && !photo.fetch('alt').empty?
    end
    raise 'Cultural illustration coverage differs from catalog' unless @illustrations.keys.sort == expected_art
    @illustrations.each do |slug, art|
      raise "Missing topic illustration: #{slug}" unless art.fetch('src') == "/assets/traditions/#{slug}.svg" && File.file?(art['src'].delete_prefix('/')) && !art.fetch('alt').strip.empty?
    end
    validate!
  end

  def entry(slug); @entries.fetch(slug); end
  def topic(slug); @topics.fetch(slug); end
  def related(slug); entry(slug).fetch('related').map { |id| topic(id) }; end
  def sources(slug); entry(slug).fetch('sources'); end
  def tools(slug); entry(slug).fetch('tools'); end

  def validate!
    raise 'Tradition link coverage differs from the topic catalog' unless @entries.keys.sort == @topics.keys.sort
    @entries.each do |slug, item|
      related = item.fetch('related')
      raise "Invalid related topics: #{slug}" if related.empty? || related.uniq != related || related.include?(slug)
      related.each { |id| topic(id) }
      item.fetch('inline',[]).each do |anchor|
        raise "Self-link in article text: #{slug}" if anchor['topic']==slug
        topic(anchor.fetch('topic'))
        field=anchor.fetch('field')
        value=if field=='intro'
          topic(slug)['intro']
        elsif (match=field.match(/\AfactNotes\[(\d+)\](\.text)?\z/))
          note=topic(slug).fetch('factNotes').fetch(match[1].to_i)
          match[2] ? note.fetch('text') : note
        end
        raise "Stale article anchor: #{slug} #{field}" unless value.is_a?(String) && !anchor.fetch('exactText').empty? && value.include?(anchor['exactText'])
      end
      item.fetch('context').each do |part|
        if part.key?('topic')
          raise "Self-link in topic context: #{slug}" if part['topic'] == slug
          topic(part.fetch('topic'))
          raise "Empty contextual label: #{slug}" if part.fetch('label').strip.empty?
        elsif part.key?('text')
          raise "HTML in topic context: #{slug}" if part.fetch('text').match?(/<[^>]*>/)
        else
          raise "Unsupported context token: #{slug}"
        end
      end
      raise "Missing topic sources: #{slug}" if sources(slug).empty?
      raise "Duplicate source URLs: #{slug}" unless sources(slug).map { |s| s['url'] }.uniq.length == sources(slug).length
      sources(slug).each do |source|
        url = URI.parse(source.fetch('url'))
        raise "Invalid external source: #{slug}" unless url.is_a?(URI::HTTPS) && url.host && !url.userinfo
        raise "Missing source label: #{slug}" if source.fetch('title').strip.empty?
      end
      raise "Missing useful topic destinations: #{slug}" if tools(slug).empty?
      tools(slug).each do |tool|
        url = URI.parse(tool.fetch('url'))
        raise "Unpublished topic tool: #{slug} -> #{url}" unless !url.host && @routes.include?(url.path)
        raise "Empty tool label: #{slug}" if tool.fetch('label').strip.empty?
      end
    end
  end
end

def tradition_text_markup(slug, value, field)
  text=value.to_s
  anchors=TRADITION_LINKING.entry(slug).fetch('inline',[]).select { |item| item['field']==field }
  return h(text) if anchors.empty?
  choices=anchors.sort_by { |item| -item['exactText'].length }
  terms=Regexp.union(choices.map { |item| item['exactText'] })
  pattern=Regexp.new("(?<![[:alnum:]])(?:#{terms.source})(?![[:alpha:]])")
  output='';position=0;used={}
  text.to_enum(:scan,pattern).each do
    match=Regexp.last_match
    output+=h(text[position...match.begin(0)])
    item=choices.find { |candidate| candidate['exactText']==match[0] }
    output+=used[item['exactText']] ? h(match[0]) : a(TRADITION_LINKING.topic(item['topic'])['url'],match[0],'tradition-inline-link')
    used[item['exactText']]=true
    position=match.end(0)
  end
  output+h(text[position..-1])
end

def tradition_context_markup(slug)
  text = TRADITION_LINKING.entry(slug).fetch('context').map do |part|
    part.key?('topic') ? a(TRADITION_LINKING.topic(part['topic'])['url'],part.fetch('label')) : h(part.fetch('text'))
  end.join
  %(<section class="tradition-context" data-tradition-context><h2>Saistītais konteksts</h2><p>#{text}</p></section>)
end

def tradition_sources_markup(slug, heading='Avoti par šo tēmu')
  links = TRADITION_LINKING.sources(slug).map do |source|
    note = source['note'].to_s.empty? ? '' : %(<small>#{h(source['note'])}</small>)
    %(<li>#{a(source.fetch('url'),source.fetch('title'))}#{note}</li>)
  end.join
  %(<section class="tradition-sources" id="temas-avoti" data-tradition-sources><h3>#{h(heading)}</h3><ul>#{links}</ul></section>)
end

def tradition_related_markup(slug)
  cards = TRADITION_LINKING.related(slug).map do |item|
    photo = item['photo'] && tradition_cover(item.fetch('photo'))
    visual = if photo
      %(<img src="#{h(photo.fetch('src'))}" srcset="#{h(photo.fetch('srcset'))}" sizes="(max-width: 700px) 46vw, (max-width: 900px) 44vw, 23vw" alt="#{h(photo.fetch('alt'))}" loading="lazy" decoding="async" width="#{photo.fetch('width')}" height="#{photo.fetch('height')}">)
    else
      art = item.fetch('illustration')
      %(<img class="tradition-related-illustration" src="#{h(art.fetch('src'))}?v={{ site.data.build.asset_version }}" alt="#{h(art.fetch('alt'))}" width="640" height="360" loading="lazy">)
    end
    %(<a href="#{h(item['url'])}">#{visual}<span>#{h(item['label'])}<b aria-hidden="true">→</b></span></a>)
  end.join
  %(<section class="occasion-related" data-tradition-related><div class="section-heading"><h2>Saistītās tēmas</h2>#{a('/svetki-un-tradicijas/','Visi svētki un tradīcijas →')}</div><div>#{cards}</div></section>)
end

def tradition_date_link(date, label=nil)
  value = Date.parse(date.to_s)
  url = "/kalendars/#{value.year}/#{SLUGS[value.month-1]}/?date=#{value.iso8601}"
  %(<a class="tradition-date-link" href="#{h(url)}" aria-label="Atvērt datumu kalendārā: #{h(value.year.to_s+'. gada '+value.day.to_s+'. '+MONTHS[value.month-1])}">#{label || %(<time datetime="#{value.iso8601}">#{h(value.day.to_s+'. '+MONTHS[value.month-1])}</time>)}</a>)
end
