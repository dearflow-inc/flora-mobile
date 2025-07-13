# Continuous Deployment Setup

This project is configured for continuous deployment using EAS Build and GitHub Actions. When you push to the `main` branch, the app will automatically be built and submitted to both iOS App Store Connect and Google Play Store.

## Prerequisites

### 1. EAS CLI Setup

Make sure you have EAS CLI installed and are logged in:

```bash
npm install -g @expo/eas-cli
eas login
```

### 2. Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

1. **EXPO_TOKEN**: Your Expo access token
   - Generate at: https://expo.dev/accounts/[username]/settings/access-tokens
   - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

### 3. iOS App Store Connect Setup

1. **Apple ID**: Already configured in `eas.json` as `tools@dearflow.ai`
2. **App Store Connect API Key**:
   - Generate at: https://appstoreconnect.apple.com/access/api
   - Download the `.p8` file
   - Add the key ID and issuer ID to your EAS project

### 4. Google Play Store Setup

1. **Service Account Key**:
   - The file `google-service-account.json` should already be in your repository
   - Make sure it has the necessary permissions for your Google Play Console

## How It Works

### Workflow Triggers

- **Trigger**: Push to `main` branch
- **Rate Limiting**: Prevents builds if a successful build was completed within the last hour

### Build Profiles

- **iOS**: Uses `testflight` profile (TestFlight distribution)
- **Android**: Uses `production` profile (Production track on Google Play)

### Process

1. **Build**: Creates a new build using EAS Build
2. **Submit**: Automatically submits the build to the respective app stores
3. **Auto-increment**: Version numbers are automatically incremented

## Manual Commands

If you need to build or submit manually:

```bash
# Build for iOS TestFlight
eas build --platform ios --profile testflight

# Build for Android Production
eas build --platform android --profile production

# Submit iOS to TestFlight
eas submit --platform ios --profile testflight

# Submit Android to Production
eas submit --platform android --profile production
```

## Troubleshooting

### Common Issues

1. **Build Fails**: Check the EAS Build logs in the GitHub Actions output
2. **Submit Fails**: Verify your app store credentials and API keys
3. **Rate Limiting**: The workflow includes a 1-hour cooldown to prevent excessive builds

### Debugging

To debug build issues locally:

```bash
# Test the build configuration
eas build:configure

# Run a local build (if supported)
eas build --local
```

## Configuration Files

- **`.github/workflows/eas-build-submit.yml`**: GitHub Actions workflow
- **`eas.json`**: EAS build and submit configuration
- **`app.config.js`**: Expo app configuration

## Notes

- The workflow runs both iOS and Android builds in parallel
- Each platform has its own job to allow independent success/failure
- Builds are rate-limited to prevent excessive resource usage
- Version auto-increment is enabled for both platforms
