import { useNavigation } from "@react-navigation/native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { SpacesList } from "@/components/spaces/SpacesList";

export const ScenariosScreen = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SpacesList
        showHeader={true}
        onBackPress={handleBack}
        showCreateButton={true}
      />
    </SafeAreaView>
  );
};
