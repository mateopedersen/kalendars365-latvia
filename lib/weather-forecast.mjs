export function currentForecast(data,now=Date.now()) {
 const series=data.properties?.timeseries,updated=Date.parse(data.properties?.meta?.updated_at);
 if(!Array.isArray(series)||!Number.isFinite(updated)||updated>now+600000||now-updated>36*3600000)throw Error('Stale or invalid model');
 const row=series.find(x=>{const stamp=Date.parse(x.time);return stamp>=now-3600000&&stamp<=now+3600000;});
 if(!row)throw Error('No current forecast step');
 const details=row.data?.instant?.details||{},period=row.data?.next_1_hours?1:6,hour=row.data?.next_1_hours||row.data?.next_6_hours;
 if(!Number.isFinite(details.air_temperature)||!hour?.summary?.symbol_code)throw Error('Incomplete weather data');
 return {modelUpdatedAt:data.properties.meta.updated_at,forecastTime:row.time,temperature:details.air_temperature,feelsLike:details.apparent_air_temperature??null,windSpeed:details.wind_speed??null,windDirection:details.wind_from_direction??null,humidity:details.relative_humidity??null,cloudCover:details.cloud_area_fraction??null,symbol:hour.summary.symbol_code,precipitation:hour.details?.precipitation_amount??null,precipitationPeriodHours:period};
}
