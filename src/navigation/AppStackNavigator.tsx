import { NavigationListener } from "@/components/NavigationListener";
import { useTheme } from "@/hooks/useTheme";
import { ChatScreen } from "@/screens/main/ChatScreen";
import { ContactSupportScreen } from "@/screens/main/ContactSupportScreen";
import { EmailsScreen } from "@/screens/main/EmailsScreen";
import { EmailThreadScreen } from "@/screens/main/EmailThreadScreen";
import { ProfileScreen } from "@/screens/main/ProfileScreen";
import { SettingsScreen } from "@/screens/main/SettingsScreen";
import { TodoDetailScreen } from "@/screens/main/TodoDetailScreen";
import { TodosScreen } from "@/screens/main/TodosScreen";
import { ToolExecutionScreen } from "@/screens/main/ToolExecutionScreen";
import { UserTaskScreen } from "@/screens/main/UserTaskScreen";
import { AppStackParamList, MainTabParamList } from "@/types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const MainTabNavigator = () => {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
    </View>
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
      <Stack.Screen
        name="EmailThreadDetail"
        component={EmailThreadScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
