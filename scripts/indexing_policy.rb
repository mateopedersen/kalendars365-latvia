# frozen_string_literal: true

# Public content is indexable, including pages that honestly report unpublished
# school dates. Missing source data must fail a build instead of silently
# publishing an extra noindex page. Error documents are not content pages.
module CalendarIndexingPolicy
  PHOTO_LICENSE_URL = '/pilsetas-un-fotografijas/'
  ERROR_URLS = %w[/404.html /500.html].freeze
  EXCLUDED_URLS = ([PHOTO_LICENSE_URL] + ERROR_URLS).freeze

  def self.noindex?(url)
    EXCLUDED_URLS.include?(url)
  end

  def self.validate!(url, noindex)
    return if !!noindex == noindex?(url)

    raise "Unexpected indexing setting for #{url}; only the photo/licensing page and error documents may be noindex"
  end
end
