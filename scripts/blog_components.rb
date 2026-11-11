# frozen_string_literal: true
# Original long-form content is held separately from the route matrix and generated deterministically.
module BlogComponents
  def self.word_count(text)
    text.gsub(/\[([^\]]+)\]\([^)]+\)/,'\1').scan(/[[:alnum:]_]+(?:[’'\-][[:alnum:]_]+)*/u).length
  end
  def self.generate(root)
    briefs=JSON.parse(File.read(File.join(root,'_data/blog-posts.json'))).fetch('posts')
    photos=JSON.parse(File.read(File.join(root,'_data/blog-photos.json'))).fetch('photos').to_h{|p|[p.fetch('id'),p]}
    sources=JSON.parse(File.read(File.join(root,'_data/blog-sources.json')))
    covers_path=File.join(root,'_data/social-images.json')
    covers=File.exist?(covers_path) ? JSON.parse(File.read(covers_path)).fetch('pages') : {}
    owner=JSON.parse(File.read(File.join(root,'_data/owner.json')))
    raise 'Expected 20 blog articles' unless briefs.length==20
    posts=briefs.map do |brief|
      raw=File.read(File.join(root,"_content/blog/#{brief.fetch('slug')}.md"),encoding:'UTF-8')
      count=word_count(raw)
      raise "Article length #{brief['slug']}: #{count}" unless (750..1000).cover?(count)
      toc=[]
      # A Latvian paragraph can begin with "2027. gada ...". Markdown would
      # consume the year as an ordered-list marker rather than article text.
      body=raw.gsub(/^([12]\d{3})\.(?=\s)/) { "#{Regexp.last_match(1)}\\." }.gsub(/^## (.+)$/) do
        title=Regexp.last_match(1);id="section-#{toc.length+1}"
        toc << {'id'=>id,'title'=>title}
        "## #{title}\n{: ##{id}}"
      end
      photo=photos.fetch(brief.fetch('photoKey'))
      post=brief.merge('url'=>"/blogs/#{brief.fetch('slug')}/",'wordCount'=>count,'readingMinutes'=>(count/180.0).ceil,'photo'=>photo,'toc'=>toc,'sources'=>brief.fetch('sourceIds').map{|key|sources.fetch(key)})
      front={'layout'=>'blog-post','family'=>'blog_article','permalink'=>post['url'],'title'=>post['title'],'description'=>post['description'],'author'=>owner.fetch('name'),'date'=>post['date'],'reading_notes'=>false,'blog_slug'=>post['slug'],'og_image'=>photo['src'],'og_image_width'=>photo['width'],'og_image_height'=>photo['height'],'og_image_alt'=>photo['alt']}
      if (cover=covers[post['url']])
        front.merge!('og_image'=>cover.fetch('src'),'og_image_width'=>cover.fetch('width'),'og_image_height'=>cover.fetch('height'),'og_image_alt'=>cover.fetch('alt'))
      end
      path=File.join(root,"_posts/#{post['date']}-#{post['slug']}.md")
      FileUtils.mkdir_p(File.dirname(path));File.write(path,front.to_yaml+"---\n"+body)
      post
    end
    File.write(File.join(root,'_data/blog.json'),JSON.pretty_generate({'posts'=>posts,'count'=>posts.length,'wordCount'=>posts.sum{|p|p['wordCount']},'publishedAt'=>posts.map{|p|p['date']}.max})+"\n")
    index={url:'/blogs/',title:'Blogs: Latvijas kalendārs un ikdienas plāni',family:'blog_index',indexable:true,status:'ready',description:'Praktiski raksti par Latvijas svētkiem, skolas un studiju kalendāriem, laika plānošanu, debesīm un dārzu. Autors Silvis Balodis.',lastmod:posts.map{|p|p['date']}.max}
    [index]+posts.map{|p|{url:p['url'],title:p['title'],family:'blog_article',indexable:true,status:'ready',description:p['description'],lastmod:p['date']}}
  end
end
