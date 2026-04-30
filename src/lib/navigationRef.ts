import { createNavigationContainerRef } from '@react-navigation/native';

// Untyped here to avoid a require-cycle with App.tsx (which is where
// `RootStackParamList` lives). Consumers that need the typed API can cast
// or import the type from `../../App` separately.
export const navigationRef = createNavigationContainerRef();
