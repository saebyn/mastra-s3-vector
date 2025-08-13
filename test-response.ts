import { GetIndexCommand } from "@aws-sdk/client-s3vectors";

// This will help us see what properties are available in the response
const command = new GetIndexCommand({
	indexName: "test",
});

// We can examine the response type
type ResponseType = Awaited<ReturnType<typeof command.resolveMiddleware>>;
