import React, { useEffect } from "react";
import { useNavigationState } from "@react-navigation/native";
import { updateNavigationState } from "@/services/notificationService";

export const NavigationListener: React.FC = () => {
  const navigationState = useNavigationState((state) => state);

  useEffect(() => {
    if (navigationState) {
      // Get the current route from the navigation state
      const getCurrentRoute = (state: any): any => {
        const route = state.routes[state.index];
        if (route.state) {
          return getCurrentRoute(route.state);
        }
        return route;
      };

      const currentRoute = getCurrentRoute(navigationState);
      if (currentRoute) {
        // Update the notification service with current screen info
        updateNavigationState(currentRoute.name);

        console.log("Navigation state updated:", {
          name: currentRoute.name,
          params: currentRoute.params,
        });
      }
    }
  }, [navigationState]);

  // This component doesn't render anything
  return null;
};
