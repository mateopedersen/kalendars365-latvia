require 'json'
require 'date'
ENV['TZ']='Europe/Riga'
data=JSON.parse(File.read(File.expand_path('../assets/horoscopes.json',__dir__)))
sections=%w[overview love work wellbeing]
abort 'Daily editorial content is missing or stale; do not relabel older content.' unless data['date']==Date.today.iso8601 && data['timeZone']=='Europe/Riga' && data['entries'].length==12 && data['entries'].values.all?{|entry|entry['date']==data['date'] && sections.all?{|key|entry[key].to_s.size>40}}
puts "Twelve dated entries verified for #{data['date']}"
