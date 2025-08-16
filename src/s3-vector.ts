import type {
	S3VectorConfig,
	DistanceMetric,
	IndexStats,
	QueryResult,
	CreateIndexParams,
	UpsertParams,
	QueryParams,
	UpdateVectorParams,
	DeleteVectorParams,
	VectorMetadata,
} from "./types.js";
import { MastraVector } from "@mastra/core";
import type {
	DescribeIndexParams,
	DeleteIndexParams,
	UpsertVectorParams,
} from "@mastra/core";

import { VectorStoreError } from "./types.js";
import {
	S3VectorsClient,
	PutVectorsCommand,
	QueryVectorsCommand,
	ListIndexesCommand,
	GetIndexCommand,
	CreateIndexCommand,
	DeleteIndexCommand,
	DeleteVectorsCommand,
} from "@aws-sdk/client-s3vectors";

/**
 * S3Vector store implementation for Mastra framework
 *
 * This class provides vector search capabilities using Amazon S3 Vectors,
 * the first cloud storage with native vector support at scale.
 */
export class S3Vector extends MastraVector {
	private vectorBucketName: string;
	private client: S3VectorsClient;

	/**
	 * Creates a new S3Vector instance
	 *
	 * @param config Configuration options for the S3Vector store
	 * @param vectorBucketName Name of the S3 vector bucket to use
	 */
	constructor(config: S3VectorConfig, vectorBucketName: string) {
		super();

		this.vectorBucketName = vectorBucketName;

		// In a real implementation, this would create the actual AWS S3 Vectors client
		// For now, we'll create a placeholder that throws descriptive errors
		this.client = this.createClient(config);
	}

	/**
	 * Creates a new vector index in S3 Vectors
	 *
	 * @param params Parameters for creating the index
	 */
	async createIndex(params: CreateIndexParams): Promise<void> {
		try {
			const command = new CreateIndexCommand({
				vectorBucketName: this.vectorBucketName,
				indexName: params.indexName,
				dataType: "float32", // S3 Vectors uses float32 for vector data
				dimension: params.dimension,
				distanceMetric: params.metric || "cosine",
			});

			await this.client.send(command);
		} catch (error) {
			throw new VectorStoreError(
				`Failed to create index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"index_creation_failed",
				error,
			);
		}
	}

	/**
	 * Adds or updates vectors and their metadata in the collection
	 *
	 * @param params Parameters for upserting vectors
	 */
	async upsert(params: UpsertVectorParams): Promise<string[]> {
		const BATCH_SIZE = 10;
		// PutVectorsCommand only supports 500 vectors per request, so we need to handle batching
		// try a smaller batch because I see request size errors with 500 vectors
		try {
			for (let i = 0; i < params.vectors.length; i += BATCH_SIZE) {
				console.log(
					`Upserting vectors ${i + 1} to ${Math.min(i + BATCH_SIZE, params.vectors.length)} into index ${params.indexName}`,
				);
				const batch = params.vectors.slice(i, i + BATCH_SIZE);
				try {
					await this.client.send(
						new PutVectorsCommand({
							vectorBucketName: this.vectorBucketName,
							indexName: params.indexName,
							vectors: batch.map((vector, index) => ({
								key: params.ids?.[i + index] || `vector_${i + index}`,
								data: { float32: vector },
								metadata: params.metadata?.[i + index] || {},
							})),
						}),
					);
				} catch (error) {
					throw new VectorStoreError(
						`Failed to upsert vectors to index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
						"upsert_failed",
						error,
					);
				}
			}

			// Return the IDs of the upserted vectors
			return params.ids || [];
		} catch (error) {
			throw new VectorStoreError(
				`Failed to upsert vectors to index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"upsert_failed",
				error,
			);
		}
	}

	/**
	 * Searches for similar vectors
	 *
	 * @param params Parameters for querying vectors
	 * @returns Array of query results
	 */
	async query(params: QueryParams): Promise<QueryResult[]> {
		try {
			const command = new QueryVectorsCommand({
				vectorBucketName: this.vectorBucketName,
				indexName: params.indexName,
				queryVector: { float32: params.queryVector },
				topK: params.topK || 10,
				filter: params.filter,
				returnDistance: true,
				returnMetadata: true,
			});

			const response = await this.client.send(command);

			return (response.vectors || [])
				.filter((result: unknown) => {
					const typedResult = result as { distance?: number };
					// Apply minScore filter if specified
					if (
						params.minScore !== undefined &&
						typedResult.distance !== undefined
					) {
						// Convert distance to similarity score (assuming cosine distance)
						const score = 1 - typedResult.distance;
						return score >= params.minScore;
					}
					return true;
				})
				.map((result: unknown) => {
					const typedResult = result as {
						key: string;
						distance?: number;
						metadata?: VectorMetadata;
						data?: { float32: number[] };
					};
					return {
						id: typedResult.key,
						score:
							typedResult.distance !== undefined ? 1 - typedResult.distance : 0, // Convert distance to similarity
						metadata: typedResult.metadata || {},
						...(params.includeVector && typedResult.data
							? { vector: typedResult.data.float32 }
							: {}),
					};
				});
		} catch (error) {
			throw new VectorStoreError(
				`Failed to query index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"query_failed",
				error,
			);
		}
	}

	/**
	 * Returns information about the index
	 *
	 * @param indexName Name of the index to describe
	 * @returns Index statistics
	 */
	async describeIndex(params: DescribeIndexParams): Promise<IndexStats> {
		try {
			const command = new GetIndexCommand({
				vectorBucketName: this.vectorBucketName,
				indexName: params.indexName,
			});

			const response = await this.client.send(command);

			return {
				dimension: response.index?.dimension || 0,
				count: 0, // S3 Vectors does not provide count directly
				metric: response.index?.distanceMetric || "cosine",
			};
		} catch (error) {
			throw new VectorStoreError(
				`Failed to describe index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"describe_failed",
				error,
			);
		}
	}

	/**
	 * Deletes an index and all its data
	 *
	 * @param indexName Name of the index to delete
	 */
	async deleteIndex(params: DeleteIndexParams): Promise<void> {
		try {
			const command = new DeleteIndexCommand({
				vectorBucketName: this.vectorBucketName,
				indexName: params.indexName,
			});

			await this.client.send(command);
		} catch (error) {
			throw new VectorStoreError(
				`Failed to delete index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"delete_index_failed",
				error,
			);
		}
	}

	/**
	 * Lists all vector indexes in the S3 vector bucket
	 *
	 * @returns Array of index names
	 */
	async listIndexes(): Promise<string[]> {
		try {
			const command = new ListIndexesCommand({
				vectorBucketName: this.vectorBucketName,
			});
			const response = await this.client.send(command);

			return (response as unknown as { indexes?: string[] }).indexes || [];
		} catch (error) {
			throw new VectorStoreError(
				`Failed to list indexes: ${error instanceof Error ? error.message : String(error)}`,
				"list_indexes_failed",
				error,
			);
		}
	}

	/**
	 * Updates a specific vector entry by its ID with new vector data and/or metadata
	 *
	 * @param params Parameters for updating the vector
	 */
	async updateVector(params: UpdateVectorParams): Promise<void> {
		try {
			// S3 Vectors requires both data and metadata for PutVectors
			// If no vector data provided, we'll need to fetch the existing vector first
			if (!params.update.vector) {
				throw new VectorStoreError(
					"Vector data is required for update operation in S3 Vectors",
					"update_requires_vector_data",
				);
			}

			const vectors = [
				{
					key: params.id,
					data: { float32: params.update.vector },
					metadata: params.update.metadata,
				},
			];

			const command = new PutVectorsCommand({
				vectorBucketName: this.vectorBucketName,
				indexName: params.indexName,
				vectors,
			});

			await this.client.send(command);
		} catch (error) {
			throw new VectorStoreError(
				`Failed to update vector ${params.id} in index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"update_vector_failed",
				error,
			);
		}
	}

	/**
	 * Deletes a specific vector entry from an index by its ID
	 *
	 * @param params Parameters for deleting the vector
	 */
	async deleteVector(params: DeleteVectorParams): Promise<void> {
		try {
			const command = new DeleteVectorsCommand({
				vectorBucketName: this.vectorBucketName,
				indexName: params.indexName,
				keys: [params.id],
			});

			await this.client.send(command);
		} catch (error) {
			throw new VectorStoreError(
				`Failed to delete vector ${params.id} from index ${params.indexName}: ${error instanceof Error ? error.message : String(error)}`,
				"delete_vector_failed",
				error,
			);
		}
	}

	protected validateExistingIndex(
		indexName: string,
		dimension: number,
		metric: string,
	): Promise<void> {
		return this.describeIndex({ indexName }).then((stats) => {
			if (stats.dimension !== dimension || stats.metric !== metric) {
				throw new VectorStoreError(
					`Index ${indexName} already exists with different dimension or metric`,
					"index_mismatch",
				);
			}
		});
	}

	/**
	 * Closes the S3 Vectors client connection
	 * Should be called when done using the store
	 */
	async disconnect(): Promise<void> {
		this.client.destroy();
	}

	/**
	 * Creates the S3 Vectors client
	 *
	 * @param config Configuration for the client
	 * @returns S3 Vectors client instance
	 */
	private createClient(config: S3VectorConfig): S3VectorsClient {
		return new S3VectorsClient({
			region: config.region,
			credentials:
				config.accessKeyId && config.secretAccessKey
					? {
							accessKeyId: config.accessKeyId,
							secretAccessKey: config.secretAccessKey,
							sessionToken: config.sessionToken,
						}
					: undefined,
			endpoint: config.endpoint,
		});
	}
}
