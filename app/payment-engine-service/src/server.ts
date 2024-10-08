import http from "http";
import { URL } from "url";
import {
	sellEnergy,
	confirmSelling,
	buyEnergy,
	confirmBuying,
} from "./paymentEngineService";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(async (req, res) => {
	if (req.method === "POST" && req.url === "/json-rpc") {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk.toString();
		});
		req.on("end", async () => {
			let id;
			try {
				const parsedBody = JSON.parse(body);
				id = parsedBody.id;
				const { method, params } = parsedBody;
				let result;
				console.log("Method:", method);
				switch (method) {
					case "sell_energy":
						result = await sellEnergy(params);
						break;
					case "confirm_selling":
						result = await confirmSelling(params);
						break;
					case "buy_energy":
						result = await buyEnergy(params);
						break;
					case "confirm_buying":
						result = await confirmBuying(params);
						break;
					default:
						throw new Error(`Method ${method} not found`);
				}
				let response = JSON.stringify({
					jsonrpc: "2.0",
					result: result,
					id,
				});

				res.writeHead(200, { "Content-Type": "application/json" });

				res.end(response);
			} catch (error: any) {
				res.writeHead(500, { "Content-Type": "application/json" });

				let response = JSON.stringify({
					jsonrpc: "2.0",
					error: { code: -32602, message: error.message },
					id,
				});
				console.error(error);

				res.end(response);
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
