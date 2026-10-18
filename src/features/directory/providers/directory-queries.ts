import { useQuery } from "@tanstack/react-query";
import { searchEmployees } from "../data/directory-api";

export const directoryKeys = {
	all: ["directory"] as const,
	search: (query: string) => [...directoryKeys.all, query] as const,
};

export function useEmployees(query: string) {
	return useQuery({
		queryKey: directoryKeys.search(query),
		queryFn: ({ signal }) => searchEmployees(query, signal),
	});
}
