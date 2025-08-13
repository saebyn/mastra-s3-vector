/**
 * @fileoverview AWS S3 Vectors integration for Mastra framework
 *
 * This library provides a vector store implementation using Amazon S3 Vectors,
 * the first cloud storage with native vector support at scale.
 */

export { S3Vector } from "./s3-vector.js";
export type {
	S3VectorConfig,
	DistanceMetric,
	IndexStats,
	VectorData,
	QueryResult,
	CreateIndexParams,
	UpsertParams,
	QueryParams,
	UpdateVectorParams,
	DeleteVectorParams,
	VectorMetadata,
} from "./types.js";
export { VectorStoreError } from "./types.js";
