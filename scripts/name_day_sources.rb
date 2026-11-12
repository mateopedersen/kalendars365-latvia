# frozen_string_literal: true
require 'json'
require 'csv'
require 'date'
require 'digest'
require 'set'

module NameDaySources
  NOTE = 'Visu neparasto un kalendāros neierakstīto vārdu diena'.freeze
  def self.read_rows(file, extended: false)
    result, latgalian = Set.new, Set.new
    CSV.foreach(file, headers: true, encoding: 'bom|utf-8') do |row|
      day, month = row.fetch('datums').split('.').map(&:to_i)
      Date.new(2000, month, day)
      cell = row.fetch('vardadienas').to_s
      if extended
        cell.scan(/\(LTG:\s*([^)]*)\)/).each do |match|
          match.first.split.each { |name| latgalian.add([name.unicode_normalize(:nfc), month, day]) }
        end
      end
      clean = cell.gsub(NOTE, '').gsub('(LTG:', ' ').delete(')')
      names = extended ? clean.split : clean.split(',')
      names.each do |name|
        name = name.strip.sub(/\.\z/, '').unicode_normalize(:nfc)
        next if name.empty? || name == '–'
        raise "Unexpected VVC name token #{name.inspect}" unless name.match?(/\A\p{Latin}+\z/u)
        result.add([name, month, day])
      end
    end
    [result, latgalian]
  end

  def self.validate!(root, dataset = nil)
    proof = JSON.parse(File.read(File.join(root, '_data/name-days-verification.json')))
    proof.fetch('sources').each do |source|
      file = File.join(root, 'docs/sources/vvc-2026', source.fetch('file'))
      raise "VVC source bytes changed: #{source.fetch('id')}" unless File.size(file) == source.fetch('bytes') && Digest::SHA256.file(file).hexdigest == source.fetch('sha256')
    end
    traditional, = read_rows(File.join(root, 'docs/sources/vvc-2026/ckan-traditional-current.csv'))
    extended, latgalian = read_rows(File.join(root, 'docs/sources/vvc-2026/vvc-extended-current.csv'), extended: true)
    expected = traditional | extended
    dataset ||= JSON.parse(File.read(File.join(root, '_data/name-days-current.json')))
    records = dataset.fetch('records')
    actual = records.map { |row| [row.fetch('name'), row.fetch('month'), row.fetch('day')] }
    raise 'Duplicate name/date records' unless actual.uniq.length == actual.length
    raise 'Duplicate name IDs' unless records.map { |row| row.fetch('id') }.uniq.length == records.length
    missing, extra = expected - actual.to_set, actual.to_set - expected
    raise "VVC mismatch: missing #{missing.to_a.first(5)}, extra #{extra.to_a.first(5)}" unless missing.empty? && extra.empty?
    records.each do |row|
      key = [row.fetch('name'), row.fetch('month'), row.fetch('day')]
      raise "Incorrect VVC list for #{key}" unless row.fetch('kind') == (traditional.include?(key) ? 'traditional' : 'extended')
      raise "Incorrect source language marker for #{key}" unless row.fetch('language') == (latgalian.include?(key) ? 'ltg' : 'lv')
      sources = []
      sources << 'traditional' if traditional.include?(key)
      sources << 'extended' if extended.include?(key)
      raise "Incorrect source membership for #{key}" unless row.fetch('sourceTypes').sort == sources.sort
    end
    counts = {'traditional'=>traditional.length, 'extendedOnly'=>(extended-traditional).length, 'total'=>expected.length}
    raise 'Incorrect VVC record counts' unless dataset.fetch('counts') == counts
    {counts: counts, matched: records.length, missing: 0, extra: 0, duplicates: 0, sourceLanguageMarkers: latgalian.length}
  end
end

puts JSON.pretty_generate(NameDaySources.validate!(File.expand_path('..', __dir__))) if $PROGRAM_NAME == __FILE__
