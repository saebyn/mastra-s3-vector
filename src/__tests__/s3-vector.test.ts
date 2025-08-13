import { describe, it, expect } from "vitest";
import { S3Vector, VectorStoreError, type S3VectorConfig } from "../index.js";

describe("S3Vector", () => {
	const config: S3VectorConfig = {
		region: "us-west-2",
		accessKeyId: "test-key",
		secretAccessKey: "test-secret",
	};

	const vectorBucketName = "test-vector-bucket";

	it("should create an instance", () => {
		const store = new S3Vector(config, vectorBucketName);
		expect(store).toBeInstanceOf(S3Vector);
	});

	it("should throw VectorStoreError for AWS SDK operations", async () => {
		const store = new S3Vector(config, vectorBucketName);

		await expect(
			store.createIndex({
				indexName: "test-index",
				dimension: 1536,
				metric: "cosine",
			}),
		).rejects.toThrow(VectorStoreError);
	});

	it("should handle AWS SDK errors correctly", async () => {
		const store = new S3Vector(config, vectorBucketName);

		try {
			await store.listIndexes();
		} catch (error) {
			expect(error).toBeInstanceOf(VectorStoreError);
			expect((error as VectorStoreError).code).toBe("list_indexes_failed");
		}
	});

	it("should handle disconnect gracefully", async () => {
		const store = new S3Vector(config, vectorBucketName);
		await expect(store.disconnect()).resolves.toBeUndefined();
	});
});

describe("VectorStoreError", () => {
	it("should create error with code and details", () => {
		const error = new VectorStoreError("Test error", "test_code", {
			additional: "data",
		});

		expect(error.message).toBe("Test error");
		expect(error.code).toBe("test_code");
		expect(error.details).toEqual({ additional: "data" });
		expect(error.name).toBe("VectorStoreError");
	});
});
