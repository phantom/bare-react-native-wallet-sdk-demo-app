# Repository instructions

## Purpose
This bare React Native demo exercises `@phantom/react-native-wallet-sdk` login, deep linking, message signing, and Solana and Ethereum transactions.

## Layout
- `App.tsx` contains the wallet SDK demo UI and integration.
- `android/` and `ios/` contain the native projects.
- `index.js` installs the URL polyfill and registers the app.

## Commands
- Install JavaScript dependencies: `npm install`
- Start Metro: `npm start`
- Run Android: `npm run android`
- Run iOS: `npm run ios`
- Lint: `npm run lint`
- Test: `npm test -- --runInBand`

## Constraints
Complete the React Native native environment setup before running the app. For iOS, run `bundle install` once, then `bundle exec pod install` after native dependency changes.
