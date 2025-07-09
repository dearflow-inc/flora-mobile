import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { MainTabParamList, AppStackParamList } from "@/types/navigation";
import { ChatScreen } from "@/screens/main/ChatScreen";
import { EmailsScreen } from "@/screens/main/EmailsScreen";
import { TodosScreen } from "@/screens/main/TodosScreen";
import { TodoDetailScreen } from "@/screens/main/TodoDetailScreen";
import { ProfileScreen } from "@/screens/main/ProfileScreen";
import { SettingsScreen } from "@/screens/main/SettingsScreen";
import { ContactSupportScreen } from "@/screens/main/ContactSupportScreen";
import { ToolExecutionScreen } from "@/screens/main/ToolExecutionScreen";
import { UserTaskScreen } from "@/screens/main/UserTaskScreen";
import { useTheme } from "@/hooks/useTheme";
import { NavigationListener } from "@/components/NavigationListener";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const MainTabNavigator = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <NavigationListener />
      <Tab.Navigator
        initialRouteName="Emails"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap;

            switch (route.name) {
              case "Chat":
                iconName = focused ? "chat" : "chat-bubble-outline";
                break;
              case "Emails":
                iconName = focused ? "email" : "email";
                break;
              case "Todos":
                iconName = focused ? "checklist" : "checklist";
                break;
              case "Profile":
                iconName = focused ? "person" : "person-outline";
                break;
              default:
                iconName = "circle";
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Emails" component={EmailsScreen} />
        <Tab.Screen name="Todos" component={TodosScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export const AppStackNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ title: "Contact Support" }}
      />
      <Stack.Screen
        name="TodoDetail"
        component={TodoDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ToolExecution"
        component={ToolExecutionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserTaskDetail"
        component={UserTaskScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
