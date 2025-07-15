import * as SecureStore from "expo-secure-store";

class SecureStorage {
  private readonly service = "FloraApp";

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Validate inputs
      if (!key || typeof key !== "string") {
        throw new Error("Invalid key provided to secureStorage.setItem");
      }

      if (value === null || value === undefined) {
        throw new Error(
          "Cannot store null or undefined value in secureStorage"
        );
      }

      if (typeof value !== "string") {
        value = String(value);
      }

      await SecureStore.setItemAsync(`${this.service}_${key}`, value);
    } catch (error) {
      console.error("SecureStorage setItem error:", error);
      // Don't throw the error to prevent app crashes, just log it
      console.warn(`Failed to store key "${key}" in secure storage:`, error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(`${this.service}_${key}`);
      return value;
    } catch (error) {
      console.error("SecureStorage getItem error:", error);
      // Return null instead of throwing to prevent crashes
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${this.service}_${key}`);
    } catch (error) {
      console.error("SecureStorage removeItem error:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear known keys
      const commonKeys = ["auth_token", "refresh_token"];
      for (const key of commonKeys) {
        try {
          await this.removeItem(key);
        } catch (error) {
          // Ignore errors for keys that don't exist
          console.warn(`Failed to remove key ${key}:`, error);
        }
      }
    } catch (error) {
      console.error("SecureStorage clear error:", error);
      throw error;
    }
  }
}

export const secureStorage = new SecureStorage();
