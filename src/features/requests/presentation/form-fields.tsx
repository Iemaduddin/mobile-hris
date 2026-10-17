import { useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors, fontSize, radius, spacing, TOUCH_MIN } from "@/core/theme";
import { formatDate, parseLocalDate, toDateOnly } from "@/core/util/format";

function toDate(value: string): Date {
	return timeStringToDate(value, new Date());
}

function timeStringToDate(value: string, fallback: Date): Date {
	const m = /^(\d{1,2}):(\d{2})$/.exec(value);
	if (!m) return fallback;
	const d = new Date(fallback);
	d.setHours(Number(m[1]), Number(m[2]), 0, 0);
	return d;
}

function toTime(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Label + slot input + pesan validasi (dipakai seluruh form pengajuan). */
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
	return (
		<View style={styles.wrap}>
			<Text style={styles.label}>{label}</Text>
			{children}
			{error ? <Text style={styles.error}>{error}</Text> : null}
		</View>
	);
}

type DateFieldProps = {
	label: string;
	/** `YYYY-MM-DD`; kosong = belum dipilih. */
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

export function DateField({ label, value, onChange, error }: DateFieldProps) {
	const [show, setShow] = useState(false);
	const date = value ? parseLocalDate(value) : new Date();

	const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
		// Android menampilkan dialog — tutup begitu pengguna memilih/membatalkan.
		if (Platform.OS !== "ios") setShow(false);
		if (event.type === "set" && picked) onChange(toDateOnly(picked));
	};

	return (
		<Field label={label} error={error}>
			<Pressable
				onPress={() => setShow((s) => !s)}
				accessibilityRole="button"
				accessibilityLabel={`${label}, ${value ? formatDate(value) : "belum dipilih"}`}
				style={[styles.input, error ? styles.inputError : null]}
			>
				<Text style={[styles.value, value ? null : styles.placeholder]} numberOfLines={1}>
					{value ? formatDate(value) : "Pilih tanggal"}
				</Text>
				<Text style={styles.chevron}>▾</Text>
			</Pressable>

			{show ? (
				Platform.OS === "ios" ? (
					<View style={styles.iosBox}>
						<DateTimePicker value={date} mode="date" display="spinner" onChange={handleChange} />
						<Pressable onPress={() => setShow(false)} style={styles.done} accessibilityRole="button">
							<Text style={styles.doneText}>Selesai</Text>
						</Pressable>
					</View>
				) : (
					<DateTimePicker value={date} mode="date" display="default" onChange={handleChange} />
				)
			) : null}
		</Field>
	);
}

type TimeFieldProps = {
	label: string;
	/** `HH:MM`. */
	value: string;
	onChange: (value: string) => void;
	error?: string;
};

export function TimeField({ label, value, onChange, error }: TimeFieldProps) {
	const [show, setShow] = useState(false);
	const date = toDate(value);

	const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
		if (Platform.OS !== "ios") setShow(false);
		if (event.type === "set" && picked) onChange(toTime(picked));
	};

	return (
		<Field label={label} error={error}>
			<Pressable
				onPress={() => setShow((s) => !s)}
				accessibilityRole="button"
				accessibilityLabel={`${label}, ${value || "belum dipilih"}`}
				style={[styles.input, error ? styles.inputError : null]}
			>
				<Text style={[styles.value, value ? null : styles.placeholder]} numberOfLines={1}>
					{value || "Pilih jam"}
				</Text>
				<Text style={styles.chevron}>▾</Text>
			</Pressable>

			{show ? (
				Platform.OS === "ios" ? (
					<View style={styles.iosBox}>
						<DateTimePicker value={date} mode="time" display="spinner" onChange={handleChange} />
						<Pressable onPress={() => setShow(false)} style={styles.done} accessibilityRole="button">
							<Text style={styles.doneText}>Selesai</Text>
						</Pressable>
					</View>
				) : (
					<DateTimePicker value={date} mode="time" display="default" onChange={handleChange} />
				)
			) : null}
		</Field>
	);
}

const styles = StyleSheet.create({
	wrap: { marginBottom: spacing.lg },
	label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
	input: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: TOUCH_MIN,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.surface,
		gap: spacing.sm,
	},
	inputError: { borderColor: colors.danger },
	value: { flex: 1, fontSize: fontSize.md, color: colors.text },
	placeholder: { color: colors.textMuted },
	chevron: { fontSize: fontSize.sm, color: colors.textMuted },
	error: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },

	iosBox: {
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.md,
		marginTop: spacing.xs,
		backgroundColor: colors.surface,
	},
	done: {
		alignItems: "center",
		paddingVertical: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	doneText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.primary },
});
