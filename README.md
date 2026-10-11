# HRIS Mobile

Aplikasi mobile HRIS (Android/iOS) dengan Expo Router. Backend-nya repo `hris`.

## Tech stack

- Expo SDK 57 + expo-router (file-based routing di `src/app/`)
- TanStack Query (data fetching) + Zustand (state sesi)
- expo-secure-store (token & device id), expo-location, expo-notifications (push + deep link)

## Fitur

- Login + sesi tersimpan aman
- Tabs: Beranda, Presensi, Pengajuan, Lainnya — plus Jadwal & Profil
- **Presensi GPS**: check-in/out dalam radius kantor + riwayat per hari
- **Pengajuan**: buat cuti/dinas/lembur + lampiran foto, detail + timeline status
- **Slip gaji**: daftar & detail per nomor slip
- **Push notification**: notifikasi saat pengajuan disetujui/ditolak, tap → langsung ke detail pengajuan (warm & cold start)

## Prasyarat

- Node.js 22, backend `hris` sedang berjalan
- Emulator Android (via Android Studio) atau HP fisik satu Wi-Fi dengan PC

## Konfigurasi (`.env`, tidak di-commit)

```env
EXPO_PUBLIC_API_URL=http://192.168.100.16:3000
```

> Wajib **IP LAN PC**, bukan `localhost` (di HP, `localhost` = HP itu sendiri).
> Cek IP: `ipconfig`. Samakan port dengan backend. Edit `.env` → restart Expo.

`google-services.json` (FCM, Android) juga tidak di-commit — minta ke maintainer,
taruh di root proyek. Kredensial push FCM V1 sudah terpasang di proyek EAS.

## Cara menjalankan

```powershell
npm install
npx expo start --port 8081
```

- Tekan `a` → emulator, atau scan QR dari HP (Expo Go / dev build).
- Butuh **development build** (modul native): `npx expo run:android`.
  Kalau Metro baru dinyalakan: `adb reverse tcp:8081 tcp:8081` untuk emulator.
- Ganti port bila bentrok: `npx expo start --port 8082`.

Backend default di port `3000`, Metro di `8081` — sudah beda, tidak bentrok.

Akun demo (dibuat dari seed backend): `employee@example.com` dan `admin@example.com`.

## Skrip

| Perintah | Kegunaan |
|---|---|
| `npx expo start` | dev server + Metro |
| `npx expo run:android` / `run:ios` | build & pasang dev client |
| `npx expo lint` | lint (wajib lolos sebelum selesai) |
| `npx tsc --noEmit` | typecheck (wajib lolos sebelum selesai) |
| `npx expo-doctor` | diagnosis dependensi |

## Build rilis (EAS)

```bash
npx eas-cli@latest build --profile development   # dev build
npx eas-cli@latest build --profile production    # rilis
```

Project ID EAS terdaftar di `app.json` (`extra.eas.projectId`).
