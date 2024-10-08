import http from "http";
import dotenv from "dotenv";
import { handleJsonRpcRequest } from "./controllers/rpcController";

dotenv.config();

const server = http.createServer(async (req, res) => {
	if (req.method === "POST" && req.url === "/json-rpc") {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk.toString();
		});
		req.on("end", async () => {
			try {
				const response = await handleJsonRpcRequest(body);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(response));
			} catch (error: any) {
				const response = {
					jsonrpc: "2.0",
					error: {
						code: -32603,
						message: error.message || "Internal error",
					},
					id: null,
				};
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify(response));
			}
		});
	} else {
		res.writeHead(404);
		res.end();
	}
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
