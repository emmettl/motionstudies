export interface WebtrisSite {id:string;description:string}
export interface WebtrisSample {interval:number;periodEnding:string;totalVolume:number|null;averageSpeedMph:number|null;lengthClassCounts:(number|null)[];classTotalMatches:boolean|null}
export interface WebtrisReport<S extends WebtrisSite=WebtrisSite> {
 schemaVersion:1;kind:'observed-detector-report-audit';serviceDate:string;
 clock:{basis:string;timezone:null;utcMapping:string;nominalIntervals:96;completeness:string};
 lengthClasses:string[];representation:string;
 audit:{inputRows:number;foreignSite:number;foreignDate:number;invalidInterval:number;exactDuplicates:number;conflictingIntervals:number};
 observations:{site:S;samples:WebtrisSample[];reportIntervals:number;validVolumeIntervals:number;validSpeedIntervals:number;missingNominalIntervals:number[];conflictingIntervals:number[];classTotalMismatches:number}[];
}
export function reportUrl(siteIds:readonly string[],serviceDate:string,page:number,pageSize?:number):string
/** Source slots and labels are retained. No UTC placement, flow-rate conversion or class inference. */
export function normalizeReports<S extends WebtrisSite>(rows:readonly Record<string,unknown>[],sites:readonly S[],serviceDate:string):WebtrisReport<S>
/** Pass stable source-record references (for example capture SHA-256 identities). */
export function aggregateRoadSeries(observation:WebtrisReport['observations'][number],serviceDate:string,dataset:string,sourceRecordIds:readonly string[]):import('@motionstudies/core/domain/aggregate-road').AggregateRoadSeries
