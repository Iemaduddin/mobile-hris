import { useLocalSearchParams } from "expo-router";
import { OnboardingDetailScreen } from "@/features/onboarding/presentation/onboarding-screen";

/** One onboarding's checklist — `id` param comes from the list. */
export default function OnboardingDetailRoute() {
	const { id } = useLocalSearchParams<{ id?: string }>();
	if (!id) return null;
	return <OnboardingDetailScreen id={id} />;
}
