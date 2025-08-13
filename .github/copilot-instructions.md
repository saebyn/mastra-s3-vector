<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a TypeScript library project that implements AWS S3 Vectors as a vector store for the Mastra AI framework.

## Project Guidelines

- Follow the Mastra vector store API pattern for consistency with other vector stores
- Use AWS SDK v3 for all AWS interactions
- Implement proper TypeScript types for all interfaces
- Follow the exact method signatures as defined in the Mastra vector store specification
- Use proper error handling and throw meaningful error messages
- Include comprehensive JSDoc comments for all public methods

## Key Components

- S3VectorStore class: Main implementation following Mastra's vector store interface
- Types: TypeScript interfaces for configuration, vectors, metadata, and responses
- Error handling: Custom error classes for different error scenarios
- Tests: Comprehensive test coverage using Vitest

## Dependencies

- @aws-sdk/client-s3vectors: AWS SDK v3 client for S3 Vectors
- Standard TypeScript development tools
