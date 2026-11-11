# frozen_string_literal: true
require 'json'
require 'set'

# Editorial decisions belong to reviewed page/family scopes and exact prose.
# This never rewrites HTML, link labels, dates, headings, downloads or controls.
class EditorialLinks
  SLUGS = %w[janvaris februaris marts aprilis maijs junijs julijs augusts septembris oktobris novembris decembris].freeze
  attr_reader :applied

  def initialize(records:, crops:)
    @records, @crops = records, crops
    @rules = JSON.parse(File.read('_data/editorial-links.json'))
    @applied = {}
    @rules.fetch('pages').each_key { |url| raise "Unknown editorial source #{url}" unless @records.key?(url) }
  end

  def indexable?(url)
    row = @records[url.split(/[?#]/).first]
    row && row['indexable']
  end

  def context(row, note)
    parts = row.fetch('url').split('/')
    year = parts.find { |part| part.match?(/\A20\d{2}\z/) }.to_i
    month = SLUGS.index(parts.last)
    suffix = year.between?(2027,2030) ? "#{year}/#{month ? SLUGS[month]+'/' : ''}" : ''
    {year:year, calendar_url:"/kalendars/#{suffix}", holiday_url:"/svetku-dienas/#{suffix}",
     work_url:"/darba-dienu-kalendars/#{suffix}", print_url:"/pdf-kalendari/#{suffix}"}
  end

  def candidates(row, note)
    url = row.fetch('url'); ctx = context(row,note)
    reviewed = @rules.fetch('pages').fetch(url,[]).map { |r| r.merge('required'=>true) }
    family = @rules.fetch('families').fetch(row.fetch('family'),[])
    # Only the crops explicitly named in that month's actual data can match.
    crops = row['family']=='garden_month' ? @crops.map { |c| {'text'=>c.fetch('name'),'url'=>"/sejas-kalendars/#{c.fetch('id')}/"} } : []
    (reviewed+family+crops).map do |rule|
      next if rule['year'] && rule['year']!=ctx[:year]
      text = rule.fetch('text') % ctx; target = rule.fetch('url') % ctx
      raise "Invalid editorial target #{url} -> #{target}" unless target.start_with?('/') && indexable?(target)
      next if target.split(/[?#]/).first == url
      rule.merge('text'=>text, 'url'=>target)
    end.compact
  end

  def enrich!(notes)
    notes.each do |url,note|
      row = @records.fetch(url)
      paragraphs = note.fetch('paragraphs')
      selected = Array.new(paragraphs.length) { [] }; used = Set.new
      if row['indexable']
        candidates(row,note).each do |rule|
          pattern = Regexp.new("(?<![[:alpha:]])#{Regexp.escape(rule.fetch('text'))}(?![[:alpha:]])",Regexp::IGNORECASE)
          found = paragraphs.each_with_index.map do |text,index|
            match = pattern.match(text)
            match && [index,match]
          end.compact.first
          raise "Stale editorial prose anchor #{url}: #{rule['text']}" if !found && rule['required']
          next unless found
          index, match = found
          next if used.include?(rule['url']) || used.size >= @rules.fetch('maxLinksPerNote')
          next if selected[index].length >= @rules.fetch('maxLinksPerParagraph')
          next if selected[index].any? { |link| match.begin(0)<link['end'] && match.end(0)>link['start'] }
          selected[index] << {'start'=>match.begin(0),'end'=>match.end(0),'text'=>match[0],'url'=>rule['url']}
          used.add(rule['url'])
        end
      end
      note['linkedParagraphs'] = paragraphs.each_with_index.map do |text,index|
        tokens=[];position=0
        selected[index].sort_by { |link| link['start'] }.each do |link|
          tokens << {'text'=>text[position...link['start']]} if position<link['start']
          tokens << {'text'=>link['text'],'url'=>link['url']}; position=link['end']
        end
        tokens << {'text'=>text[position..-1]} if position<text.length
        raise "Editorial prose changed #{url}" unless tokens.map { |t| t['text'] }.join==text
        tokens
      end
      @applied[url]={'family'=>row['family'],'links'=>selected.each_with_index.flat_map { |items,index| items.map { |item| {'paragraph'=>index+1,'text'=>item['text'],'url'=>item['url']} } }} unless used.empty?
    end
    File.write('docs/EDITORIAL_PROSE_LINKS.json',JSON.pretty_generate({'schemaVersion'=>1,
      'scope'=>'Inline links within explanatory paragraphs, excluding navigation and recommendations',
      'linkedPages'=>@applied.length,'linkOccurrences'=>@applied.values.sum { |p| p['links'].length },'pages'=>@applied})+"\n")
  end
end
