import "react-native-url-polyfill/auto";
import React from "react";
import { AppRegistry } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store, persistor } from "./src/store";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { LoadingScreen } from "./src/screens/LoadingScreen";
import { WebSocketProvider } from "./src/contexts/WebSocketContext";

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <WebSocketProvider>
            <SafeAreaProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
              </NavigationContainer>
            </SafeAreaProvider>
          </WebSocketProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;

// Register the main component
AppRegistry.registerComponent("main", () => App);
