# frozen_string_literal: true
require 'minitest/autorun'
require 'json'
require_relative '../lib/calendar'

class CalendarDateTest < Minitest::Test
  def test_all_1461_dates_and_48_months
    seen=[]
    (2027..2030).each do |year|
      (1..12).each do |month|
        grid=Calendar365.month_grid(year,month)
        assert grid.length.between?(4,6)
        assert grid.all? { |w| w[:days].length==7 }
        actual=grid.flat_map { |w| w[:days] }.select { |d| d[:inMonth] }
        expected=(Date.new(year,month,1)..Date.new(year,month,-1)).to_a
        assert_equal expected.map(&:iso8601),actual.map { |d| d[:date] }
        actual.each do |day|
          date=Date.iso8601(day[:date]); seen << day[:date]
          assert_equal date.cwday,day[:weekday]
          assert_equal({year:date.cwyear,week:date.cweek,weekday:date.cwday},Calendar365.iso_week(day[:date]))
        end
      end
    end
    assert_equal 1461,seen.length
    assert_equal 1461,seen.uniq.length
  end
  def test_iso_boundaries
    {'2027-01-01'=>[2026,53,5],'2028-01-01'=>[2027,52,6],'2029-01-01'=>[2029,1,1],'2029-12-31'=>[2030,1,1],'2030-12-31'=>[2031,1,2]}.each do |date,parts|
      assert_equal parts,Calendar365.iso_week(date).values
    end
    assert_equal 208,(2027..2030).sum { |y| Date.new(y,12,28).cweek }
  end
  def test_invalid_dates_and_leap_day
    assert_equal Date.new(2028,2,29),Calendar365.parse_iso('2028-02-29')
    %w[2030-02-29 2029-02-29 2027-13-01 2027-02-30 2027-2-01 bad].each { |s| assert_raises(ArgumentError) { Calendar365.parse_iso(s) } }
  end
  def test_easter_against_independent_fixtures
    {2027=>'2027-03-28',2028=>'2028-04-16',2029=>'2029-04-01',2030=>'2030-04-21'}.each do |year,date|
      assert_equal date,Calendar365.easter(year).iso8601
      assert Calendar365.holidays(year).any? { |r| r[:date]==(Date.iso8601(date)-2).iso8601 && r[:dayOff] }
      usno=JSON.parse(File.read(File.expand_path("../_data/usno-christian-#{year}.json",__dir__)))['data']
      {'Easter'=>'Pirmās Lieldienas','Good Friday'=>'Lielā Piektdiena','Whit Sunday -- Pentecost'=>'Vasarsvētki'}.each do |external,local|
        r=usno.find { |v| v['observance']==external }
        assert_equal Date.new(r['year'],r['month'],r['day']).iso8601,Calendar365.holidays(year).find { |v| v[:title]==local }[:date]
      end
    end
  end
  def test_statutory_substitutes_only
    assert Calendar365.holidays(2028).any? { |r| r[:date]=='2028-11-20' && r[:type]=='substitute' }
    assert Calendar365.holidays(2029).any? { |r| r[:date]=='2029-11-19' && r[:type]=='substitute' }
    assert Calendar365.holidays(2030).any? { |r| r[:date]=='2030-05-06' && r[:type]=='substitute' }
    assert Calendar365.is_workday('2027-05-03') # May 1 has no automatic substitute.
    assert Calendar365.is_workday('2027-11-11') # Commemoration, not a day off.
    refute Calendar365.is_workday('2029-11-19')
    assert Calendar365.holidays(2028).any? { |r| r[:date]=='2028-07-09' && r[:type]=='holiday' && r[:dateSource] }
    refute Calendar365.is_workday('2028-07-10')
    assert Calendar365.is_workday('2027-07-09')
  end
  def test_working_assumptions_and_hours
    assert_equal 252,Calendar365.workdays('2027-01-01','2027-12-31')
    assert_equal 2009,(Date.new(2027,1,1)..Date.new(2027,12,31)).sum { |d| Calendar365.work_hours(d) }
    assert_equal 7,Calendar365.work_hours('2027-04-30')
    assert_equal 8,Calendar365.work_hours('2027-05-03',shorten:false)
    assert_equal 5,Calendar365.work_hours('2027-02-06',week_length:6)
    assert_equal 0,Calendar365.work_hours('2027-01-01')
    assert Calendar365.is_workday('2027-01-02',overrides:{'2027-01-02'=>true})
    refute Calendar365.is_workday('2027-01-04',overrides:{'2027-01-04'=>false})
    assert_equal 2,Calendar365.workdays('2027-01-04','2027-01-05')
    assert_equal 1,Calendar365.workdays('2027-01-04','2027-01-05',include_end:false)
    assert_equal(-2,Calendar365.workdays('2027-01-05','2027-01-04'))
    assert_equal 0,Calendar365.workdays('2027-01-04','2027-01-04',include_end:false)
    assert_raises(ArgumentError) { Calendar365.is_workday('2027-01-04',week_length:4) }
  end
  def test_published_data_structure
    data=JSON.parse(File.read(File.expand_path('../assets/calendar-data.json',__dir__)))
    assert_equal 198,data['moon'].length
    assert_equal [49,50,49,50],(2027..2030).map { |y| data['moon'].count { |r| r['date'].start_with?(y.to_s) } }
    assert_equal 4,data['school'].length
    assert data['school'].all? { |r| r['status']=='verified' && r['academicYear']=='2026-2027' }
    assert data['schoolYears'].drop(1).all? { |r| r['status']=='pending' }
    assert_equal 24,data['seasons'].length
    assert_equal 8,data['seasons'].count { |s| s['phenomenon']=='Solstice' }
    assert_equal 1013,data['names'].length
    assert data['names'].all? { |r| r['edition']=='2018' && !r['currentEditionVerified'] }
    refute data['assumptions']['namesComplete']
    %w[Emīlija Teodors Sofija Marks Amēlija Olivers Emma Kārlis Alise Gustavs Anna Roberts Nora Jēkabs Marta Ričards Olīvija Emīls Estere Everts].each { |name| assert data['names'].any? { |r| r['name']==name } }
  end
  def test_cross_year_month_grid_overlays
    jan=Calendar365.month_grid(2027,1).flat_map { |w| w[:days] }
    assert jan.find { |d| d[:date]=='2026-12-31' }[:holiday].any? { |r| r[:title]=='Vecgada diena' }
    dec=Calendar365.month_grid(2030,12).flat_map { |w| w[:days] }
    assert dec.find { |d| d[:date]=='2031-01-01' }[:holiday].any? { |r| r[:title]=='Jaungada diena' }
  end
end
