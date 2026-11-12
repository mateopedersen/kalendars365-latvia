// Future integration contract only. No listeners, persistence or network transport.
const formats=new Set(['pdf','webp','jpg','png','docx','xlsx','svg','ics']);
const names=new Set(['calendar_download_click','calendar_print_request','calendar_ics_export_request','calculator_result_rendered']);
const families=new Set(['hub','year','calendar_month','month_index','week_index','iso_week','print_index','print_month','holiday_year','holiday_month','memorial_year','work_year','work_month','name_calendar','name_day_month','lunar_year','lunar_month','sun_city','moon_city','school_academic','school_year_calendar','blog_index','blog_article','horoscope','garden','garden_month','long_weekends','latvia_special','latvia_cultural','occasion','city_photos','sky_hub']);
export function interactionEvent(name,input={}){
 if(!names.has(name))throw new RangeError('Unknown measurement event');
 const payload={event:name};
 if(families.has(input.family))payload.family=input.family;
 if(formats.has(input.format))payload.format=input.format;
 if(Number.isInteger(input.year)&&input.year>=2027&&input.year<=2030)payload.year=input.year;
 if(Number.isInteger(input.month)&&input.month>=1&&input.month<=12)payload.month=input.month;
 if(Number.isInteger(input.design)&&input.design>=1&&input.design<=30)payload.design=input.design;
 return payload;
}
