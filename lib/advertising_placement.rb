# frozen_string_literal: true
# Insert outside the heading/hero block, preserving the original HTML bytes.
module AdvertisingPlacement
  VOIDS = %w[area base br col embed hr img input link meta param source track wbr].freeze
  def self.after_intro(html, markup)
    return html if markup.to_s.strip.empty?
    stack = []
    target = nil
    fallback = nil
    html.to_enum(:scan, /<!--[\s\S]*?-->|<\/?([a-z][a-z0-9:-]*)\b[^>]*>/i).each do
      match = Regexp.last_match
      next unless match[1]
      tag = match[1].downcase
      closing = match[0].start_with?('</')
      unless closing
        node = {tag: tag, start: match.begin(0)}
        if tag == 'h1'
          target = stack.reverse.find { |item| %w[header section].include?(item[:tag]) }
          fallback = node unless target
        end
        stack << node unless VOIDS.include?(tag) || match[0].end_with?('/>')
        next
      end
      index = stack.rindex { |item| item[:tag] == tag }
      next unless index
      node = stack[index]
      stack = stack.take(index)
      next unless (target && node.equal?(target)) || (fallback && node.equal?(fallback))
      position = match.end(0)
      if fallback
        paragraph = html[position..].match(/\A\s*<p\b[^>]*>[\s\S]*?<\/p>/i)
        position += paragraph.end(0) if paragraph
      end
      return html[0...position] + markup + html[position..]
    end
    raise 'A canonical advertising page has no complete heading block'
  end
  def self.word_count(html)
    html.gsub(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/i, '').gsub(/<[^>]+>/, ' ').scan(/[\p{L}\p{N}]+/u).length
  end
  def self.secondary(html, markup)
    return html if markup.to_s.strip.empty?
    stack = []
    nodes = []
    html.to_enum(:scan, /<!--[\s\S]*?-->|<\/?([a-z][a-z0-9:-]*)\b[^>]*>/i).each do
      match = Regexp.last_match
      next unless match[1]
      tag = match[1].downcase
      unless match[0].start_with?('</')
        node = {tag: tag, start: match.begin(0), attributes: match[0], parents: stack.dup}
        stack << node unless VOIDS.include?(tag) || match[0].end_with?('/>')
        next
      end
      index = stack.rindex { |item| item[:tag] == tag }
      next unless index
      node = stack[index]
      stack = stack.take(index)
      node[:end] = match.end(0)
      nodes << node
    end
    article = nodes.select { |node| node[:tag] == 'article' && node[:attributes].match?(/\b(?:event-guide|benefit-guide|journal-article)\b/) }.min_by { |node| node[:parents].length }
    return html unless article
    total = word_count(html[article[:start]...article[:end]])
    return html if total < 650
    ratio = ->(node) { word_count(html[article[:start]...node[:end]]).to_f / total }
    candidates = nodes.select do |node|
      %w[section div].include?(node[:tag]) && node[:parents].last.equal?(article) &&
        !node[:attributes].include?('data-advertising') && word_count(html[node[:start]...node[:end]]) >= 80 && ratio.call(node).between?(0.2, 0.8)
    end
    if candidates.empty?
      candidates = nodes.select do |node|
        node[:tag] == 'p' && node[:parents].include?(article) &&
          node[:parents].none? { |parent| %w[header aside nav form table details].include?(parent[:tag]) || parent[:attributes].match?(/\b(?:[\w-]*(?:grid|card|controls|filters|actions|sidebar))\b/i) } && ratio.call(node).between?(0.3, 0.7)
      end
    end
    target = candidates.min_by { |node| (ratio.call(node) - 0.45).abs }
    return html unless target
    html[0...target[:end]] + markup + html[target[:end]..]
  end

end
