/**
 * Configuration options for S3Vector store
 */
export interface S3VectorConfig {
	/** AWS region for the S3 service */
	region: string;
	/** AWS access key ID */
	accessKeyId?: string;
	/** AWS secret access key */
	secretAccessKey?: string;
	/** AWS session token (if using temporary credentials) */
	sessionToken?: string;
	/** Custom endpoint URL (for testing or custom S3-compatible services) */
	endpoint?: string;
}

/**
 * Distance metrics supported by S3 Vectors
 */
export type DistanceMetric = "cosine" | "euclidean";

/**
 * Vector index statistics
 */
export interface IndexStats {
	/** Dimension of vectors in the index */
	dimension: number;
	/** Number of vectors in the index */
	count: number;
	/** Distance metric used by the index */
	metric: DistanceMetric;
}

/**
 * Metadata type for vector data
 */
export type VectorMetadata = Record<string, string | number | boolean | null>;

/**
 * Vector data with metadata
 */
export interface VectorData {
	/** Unique identifier for the vector */
	id: string;
	/** Vector embedding data */
	vector: number[];
	/** Associated metadata */
	metadata?: VectorMetadata;
}

/**
 * Query result from vector search
 */
export interface QueryResult {
	/** Vector identifier */
	id: string;
	/** Similarity score */
	score: number;
	/** Associated metadata */
	metadata: VectorMetadata;
	/** Vector data (only included if includeVector is true) */
	vector?: number[];
}

/**
 * Parameters for creating a vector index
 */
export interface CreateIndexParams {
	/** Name of the index to create */
	indexName: string;
	/** Vector dimension (must match your embedding model) */
	dimension: number;
	/** Distance metric for similarity search */
	metric?: DistanceMetric;
}

/**
 * Parameters for upserting vectors
 */
export interface UpsertParams {
	/** Name of the index to insert into */
	indexName: string;
	/** Array of embedding vectors */
	vectors: number[][];
	/** Metadata for each vector */
	metadata?: VectorMetadata[];
	/** Optional vector IDs (auto-generated if not provided) */
	ids?: string[];
}

/**
 * Parameters for querying vectors
 */
export interface QueryParams {
	/** Name of the index to search in */
	indexName: string;
	/** Query vector to find similar vectors for */
	queryVector: number[];
	/** Number of results to return */
	topK?: number;
	/** Metadata filters */
	filter?: VectorMetadata;
	/** Whether to include vector data in results */
	includeVector?: boolean;
	/** Minimum similarity score threshold */
	minScore?: number;
}

/**
 * Parameters for updating a vector
 */
export interface UpdateVectorParams {
	/** Name of the index containing the vector */
	indexName: string;
	/** ID of the vector entry to update */
	id: string;
	/** Update data containing vector and/or metadata */
	update: {
		/** New vector data to update */
		vector?: number[];
		/** New metadata to update */
		metadata?: VectorMetadata;
	};
}

/**
 * Parameters for deleting a vector
 */
export interface DeleteVectorParams {
	/** Name of the index containing the vector */
	indexName: string;
	/** ID of the vector entry to delete */
	id: string;
}

/**
 * Vector store error types
 */
export class VectorStoreError extends Error {
	constructor(
		message: string,
		public code: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "VectorStoreError";
	}
}
