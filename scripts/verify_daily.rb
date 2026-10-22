require 'json'
require 'date'
ENV['TZ']='Europe/Riga'
data=JSON.parse(File.read(File.expand_path('../assets/horoscopes.json',__dir__)))
abort 'Daily editorial content is missing or stale; do not relabel older content.' unless data['date']==Date.today.iso8601 && data['entries'].length==12 && data['entries'].values.all?{|v|v['date']==data['date'] && v['text'].size>150}
puts "Twelve dated entries verified for #{data['date']}"
