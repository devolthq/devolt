import {
	JsonRpcRequest,
	JsonRpcSuccessResponse,
	JsonRpcErrorResponse,
} from "../types/rpcTypes";
import { sellEnergyService } from "../services/sellEnergyService";
import { buyEnergyService } from "../services/buyEnergyService";
import { confirmSellingService } from "../services/confirmSellingService";
import { confirmBuyingService } from "../services/confirmBuyingService";

export async function handleJsonRpcRequest(
	body: string
): Promise<JsonRpcSuccessResponse | JsonRpcErrorResponse> {
	let parsedBody: JsonRpcRequest;
	try {
		parsedBody = JSON.parse(body);
	} catch (error: any) {
		return {
			jsonrpc: "2.0",
			error: { code: -32700, message: "Parse error" },
			id: null,
		};
	}

	const { method, params, id } = parsedBody;

	try {
		let result;
		console.log("Method:", method);
		switch (method) {
			case "sell_energy":
				result = await sellEnergyService(params);
				break;
			case "confirm_selling":
				result = await confirmSellingService(params);
				break;
			case "buy_energy":
				result = await buyEnergyService(params);
				break;
			case "confirm_buying":
				result = await confirmBuyingService(params);
				break;
			default:
				throw new Error(`Method ${method} not found`);
		}

		return {
			jsonrpc: "2.0",
			result,
			id,
		};
	} catch (error: any) {
		console.error(`Error handling method ${method}:`, error);
		return {
			jsonrpc: "2.0",
			error: { code: -32603, message: error.message || "Internal error" },
			id,
		};
	}
}
