import moment from 'moment-timezone';
export const zone = name => typeof name === 'string' && moment.tz.names().includes(name) ? moment.tz.zone(name) : null;
export const timeZoneNames = () => moment.tz.names();
export const timeZoneVersion = moment.tz.dataVersion;
