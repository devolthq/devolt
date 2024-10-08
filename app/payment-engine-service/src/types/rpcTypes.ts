export interface JsonRpcRequest {
	jsonrpc: string;
	method: string;
	params: any;
	id: number | string;
}

export interface JsonRpcSuccessResponse {
	jsonrpc: string;
	result: any;
	id: number | string;
}

export interface JsonRpcError {
	code: number;
	message: string;
}

export interface JsonRpcErrorResponse {
	jsonrpc: string;
	error: JsonRpcError;
	id: number | string | null;
}
