export interface DbStatement { bind(...args: unknown[]): DbStatement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{results:T[]}>; run():Promise<{meta:{changes:number;last_row_id:number}}>;}
export const env: {DB:{prepare(sql:string):DbStatement;batch(statements:DbStatement[]):Promise<Array<{meta:{changes:number;last_row_id:number}}>>;transaction<T>(fn:(tx:{prepare(sql:string):DbStatement})=>Promise<T>):Promise<T>}};
export function closeDatabase(): Promise<void>;
