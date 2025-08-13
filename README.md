# @mastra/s3-vector

AWS S3 Vectors integration for the Mastra AI framework - the first cloud storage with native vector support at scale.

## Overview

This library provides a vector store implementation for the [Mastra](https://mastra.ai) framework using Amazon S3 Vectors, which was announced as the first cloud object store with native support to store large vector datasets and provide subsecond query performance. It can reduce the total cost of uploading, storing, and querying vectors by up to 90 percent compared to traditional vector databases.

## Features

- **Native S3 Vector Support**: Built on Amazon S3 Vectors for massive scale and cost efficiency
- **Mastra Compatible**: Implements the standard Mastra vector store interface
- **TypeScript Support**: Fully typed with comprehensive TypeScript definitions
- **Multiple Distance Metrics**: Supports cosine and euclidean distance metrics
- **Metadata Filtering**: Store and filter by key-value metadata
- **Cost Effective**: Up to 90% cost reduction compared to traditional vector databases
- **Serverless**: No infrastructure to manage or provision

## Prerequisites

- **AWS Account**: With S3 Vectors preview access
- **Node.js**: Version 18.0.0 or higher
- **AWS Credentials**: Configured for S3 Vectors access

## Installation

```bash
npm install @mastra/s3-vector
```

## Quick Start

```typescript
import { S3Vector } from '@mastra/s3-vector';

// Initialize the S3Vector store
const vectorStore = new S3Vector(
  {
    region: 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  'my-vector-bucket' // Your S3 vector bucket name
);

// Create a vector index
await vectorStore.createIndex({
  indexName: 'embeddings',
  dimension: 1536, // Match your embedding model
  metric: 'cosine'
});

// Insert vectors
await vectorStore.upsert({
  indexName: 'embeddings',
  vectors: [
    [0.1, 0.2, 0.3, ...], // Your embedding vectors
    [0.4, 0.5, 0.6, ...]
  ],
  metadata: [
    { title: 'Document 1', category: 'tech' },
    { title: 'Document 2', category: 'science' }
  ],
  ids: ['doc1', 'doc2'] // Optional - auto-generated if not provided
});

// Query similar vectors
const results = await vectorStore.query({
  indexName: 'embeddings',
  queryVector: [0.1, 0.2, 0.3, ...],
  topK: 5,
  filter: { category: 'tech' }, // Optional metadata filter
  includeVector: true // Include vector data in results
});

console.log(results);
// [
//   {
//     id: 'doc1',
//     score: 0.95,
//     metadata: { title: 'Document 1', category: 'tech' },
//     vector: [0.1, 0.2, 0.3, ...]
//   }
// ]
```

## Configuration

### S3VectorConfig

```typescript
interface S3VectorConfig {
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
```

### Environment Variables

You can configure AWS credentials using environment variables:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
```

## API Reference

### Constructor

```typescript
new S3Vector(config: S3VectorConfig, vectorBucketName: string)
```

### Methods

#### `createIndex(params: CreateIndexParams): Promise<void>`

Creates a new vector index.

```typescript
await vectorStore.createIndex({
  indexName: 'my-index',
  dimension: 1536,
  metric: 'cosine' // or 'euclidean'
});
```

#### `upsert(params: UpsertParams): Promise<void>`

Adds or updates vectors and their metadata.

```typescript
await vectorStore.upsert({
  indexName: 'my-index',
  vectors: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
  metadata: [{ title: 'Doc 1' }, { title: 'Doc 2' }],
  ids: ['id1', 'id2'] // Optional
});
```

#### `query(params: QueryParams): Promise<QueryResult[]>`

Searches for similar vectors.

```typescript
const results = await vectorStore.query({
  indexName: 'my-index',
  queryVector: [0.1, 0.2, 0.3],
  topK: 10,
  filter: { category: 'tech' }, // Optional
  includeVector: false, // Optional
  minScore: 0.7 // Optional
});
```

#### `describeIndex(indexName: string): Promise<IndexStats>`

Returns information about an index.

```typescript
const stats = await vectorStore.describeIndex('my-index');
// { dimension: 1536, count: 1000, metric: 'cosine' }
```

#### `listIndexes(): Promise<string[]>`

Lists all indexes in the vector bucket.

```typescript
const indexes = await vectorStore.listIndexes();
// ['index1', 'index2', 'index3']
```

#### `deleteIndex(indexName: string): Promise<void>`

Deletes an index and all its data.

```typescript
await vectorStore.deleteIndex('my-index');
```

#### `updateVector(params: UpdateVectorParams): Promise<void>`

Updates a specific vector entry.

```typescript
await vectorStore.updateVector({
  indexName: 'my-index',
  id: 'vector-id',
  update: {
    vector: [0.1, 0.2, 0.3], // Required for S3 Vectors
    metadata: { title: 'Updated Document' }
  }
});
```

#### `deleteVector(params: DeleteVectorParams): Promise<void>`

Deletes a specific vector entry.

```typescript
await vectorStore.deleteVector({
  indexName: 'my-index',
  id: 'vector-id'
});
```

#### `disconnect(): Promise<void>`

Closes the client connection.

```typescript
await vectorStore.disconnect();
```

## Usage with Mastra

This vector store integrates seamlessly with the Mastra framework:

```typescript
import { Mastra } from '@mastra/core';
import { S3Vector } from '@mastra/s3-vector';

const mastra = new Mastra({
  vectorStore: new S3Vector(
    { region: 'us-west-2' },
    'my-vector-bucket'
  )
});
```

## Error Handling

The library throws typed errors for different scenarios:

```typescript
import { VectorStoreError } from '@mastra/s3-vector';

try {
  await vectorStore.query({ /* params */ });
} catch (error) {
  if (error instanceof VectorStoreError) {
    console.log(error.code); // Error type: 'query_failed', 'index_not_found', etc.
    console.log(error.message); // Human-readable error message
    console.log(error.details); // Additional error context
  }
}
```

## Limitations

- **Preview Service**: S3 Vectors is currently in preview
- **Regional Availability**: Available in US East (N. Virginia), US East (Ohio), US West (Oregon), Europe (Frankfurt), and Asia Pacific (Sydney)
- **Update Operations**: Vector updates require providing the complete vector data
- **Index Creation**: Asynchronous operation that may take time for large datasets

## Cost Optimization

S3 Vectors provides significant cost savings:

- **Storage**: Pay only for vectors stored, with automatic optimization
- **Queries**: Subsecond performance without provisioned infrastructure
- **No Servers**: Serverless architecture eliminates operational costs
- **Scaling**: Automatically scales with your data without capacity planning

## Integration with AWS Services

S3 Vectors integrates natively with:

- **Amazon Bedrock Knowledge Bases**: For RAG applications
- **Amazon SageMaker Unified Studio**: For AI development workflows  
- **Amazon OpenSearch Service**: For tiered storage strategies

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to help improve this library.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **AWS Documentation**: [S3 Vectors User Guide](https://docs.aws.amazon.com/s3/latest/userguide/s3-vectors.html)
- **Mastra Documentation**: [Vector Stores](https://mastra.ai/docs/vector-stores)
- **Issues**: Report bugs and feature requests on [GitHub](https://github.com/mastra-ai/mastra-s3-vector/issues)

## Related

- [Mastra Framework](https://mastra.ai)
- [AWS S3 Vectors](https://aws.amazon.com/s3/features/vectors/)
- [Amazon Bedrock](https://aws.amazon.com/bedrock/)
- [Other Mastra Vector Stores](https://mastra.ai/reference/rag/)
