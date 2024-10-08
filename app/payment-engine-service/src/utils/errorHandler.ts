export function handleError(error: any) {
	console.error("Error:", error.message || "Internal error");
	if (error.logs) {
		const specificLog = error.logs.find((log: string) =>
			log.includes("Allocate: account Address")
		);
		if (specificLog) {
			const address = specificLog.split(" ")[2];
			console.error(`Account ${address} already exists`);
			return {
				error: {
					code: -32603,
					message: `Account ${address} already exists`,
				},
			};
		}
	}
	return {
		error: { code: -32603, message: error.message || "Internal error" },
	};
}
