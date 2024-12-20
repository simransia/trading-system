export interface DbConnection {
  connectToMongo: () => Promise<void>;
}

export declare function connectToMongo(): Promise<void>;
