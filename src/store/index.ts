import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authSlice } from "./slices/authSlice";
import { appSlice } from "./slices/appSlice";
import { profileSlice } from "./slices/profileSlice";
import chatSlice from "./slices/chatSlice";
import todoSlice from "./slices/todoSlice";
import emailSlice from "./slices/emailSlice";
import toolExecutionSlice from "./slices/toolExecutionSlice";
import userTaskSlice from "./slices/userTaskSlice";
import scenariosSlice from "./slices/scenariosSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "profile", "toolExecutions"], // Persist auth, profile, and tool executions (drafts), chat and todos will be fetched from backend
};

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  app: appSlice.reducer,
  profile: profileSlice.reducer,
  chat: chatSlice,
  todos: todoSlice,
  emails: emailSlice,
  toolExecutions: toolExecutionSlice,
  userTasks: userTaskSlice,
  scenarios: scenariosSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
