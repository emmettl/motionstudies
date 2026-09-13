/** UK civil day boundaries. GTFS service time has a separate noon-based origin. */
export interface UkStudyDay {serviceDate:string;timezone:'Europe/London';startUtc:string;endUtc:string;durationSeconds:number}
export function checkedDate(value:string):string
export function studyDay(serviceDate:string):UkStudyDay
export function utcDatesForDay(day:UkStudyDay):string[]
export function gtfsServiceInstant(serviceDate:string,seconds:number):string
