import { CreateIndexCommand } from "@aws-sdk/client-s3vectors";

// This will help us see what parameters are expected
const command = new CreateIndexCommand({
	// We'll see what autocomplete suggests here
});
