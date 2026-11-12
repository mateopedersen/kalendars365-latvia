# frozen_string_literal: true
require 'cgi'

# Search the page's own prose, not its shared header/footer or HTML attributes.
# Store unique words so complete articles remain searchable without repeating text.
module CalendarSearchContent
  def self.plain_text(value)
    CGI.unescapeHTML(value.to_s
      .gsub(/<(script|style|svg)\b[^>]*>.*?<\/\1>/mi, ' ')
      .gsub(/<!--.*?-->/m, ' ')
      .gsub(/\{%.*?%\}|\{\{.*?\}\}/m, ' ')
      .gsub(/<[^>]*>/m, ' ')
      .gsub(/!?\[([^\]]+)\]\([^)]*\)/, '\1'))
      .gsub(/\s+/, ' ').strip
  end

  def self.fields(root, page, guide)
    url=page.fetch(:url)
    path=if page[:family]=='blog_article'
      File.join(root, '_content/blog', url.split('/').last+'.md')
    elsif url=='/'
      File.join(root, 'index.html')
    elsif url=='/pilsetas-un-fotografijas/'
      File.join(root, 'pilsetas-un-fotografijas.html')
    else
      File.join(root, 'generated', url.delete_prefix('/'), 'index.html')
    end
    source=File.file?(path) ? File.read(path,encoding:'UTF-8') : ''
    source=source.split(/^---\s*$/,3).fetch(2,source) if source.start_with?('---')
    headings=source.scan(/<h[1-6]\b[^>]*>(.*?)<\/h[1-6]>/mi).flatten
    headings.concat(source.scan(/^\#{1,6}\s+(.+)$/).flatten)
    headings << guide['heading'] if guide
    prose=[plain_text(source),*(guide ? guide.fetch('paragraphs',[]) : [])].join(' ')
    {headings:plain_text(headings.compact.join(' ')),content:prose.scan(/[[:alpha:]\d]+/u).select{|word|word.length>1}.uniq.join(' ')}
  end
end
