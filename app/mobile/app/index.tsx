import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
	const { isLoggedIn, isLoading } = useAuth();

	const [logged, setLogged] = useState(false);

	useEffect(() => {
		if (!isLoading && !isLoggedIn) {
			setLogged(false);
		} else if (!isLoading && isLoggedIn) {
			setLogged(true);
		}
	}, [isLoggedIn, isLoading]);

	if (!logged) return <Redirect href={"/onboard/onboard"} />;

	return <Redirect href={"/home/home"} />;
}
