# Curvex

A standalone Android currency-converter project.

## Diagnostic build

This first version is intentionally minimal. It verifies that the independent Capacitor Android shell launches without network requests, ad SDKs, or third-party startup plugins.

## Build locally

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

## Android identity

- App name: Curvex
- Application ID: com.studioprodigy.curvex

GitHub Actions builds a debug APK on pushes to `main` and on manual dispatch.
