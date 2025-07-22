import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  clearContextViewsError,
  clearError,
  clearScenarioItemsError,
  createContextView,
  createScenarioItem,
  deleteContextView,
  deleteScenarioItem,
  fetchMyScenarios,
  fetchScenariosByProfileId,
  selectContextViews,
  selectContextViewsError,
  selectContextViewsLoading,
  selectScenarioItems,
  selectScenarioItemsError,
  selectScenarioItemsLoading,
  selectScenarios,
  selectScenariosError,
  selectScenariosLoading,
  updateContextView,
  updateScenarioItem,
} from "@/store/slices/scenariosSlice";
import {
  CreateContextViewRequest,
  CreateScenarioItemRequest,
  ScenarioItem,
  UpdateContextViewRequest,
} from "@/types/scenarios";

export const useScenarios = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const scenarios = useAppSelector(selectScenarios);
  const loading = useAppSelector(selectScenariosLoading);
  const error = useAppSelector(selectScenariosError);

  const contextViews = useAppSelector(selectContextViews);
  const contextViewsLoading = useAppSelector(selectContextViewsLoading);
  const contextViewsError = useAppSelector(selectContextViewsError);

  const scenarioItems = useAppSelector(selectScenarioItems);
  const scenarioItemsLoading = useAppSelector(selectScenarioItemsLoading);
  const scenarioItemsError = useAppSelector(selectScenarioItemsError);

  // Actions
  const fetchScenarios = () => dispatch(fetchMyScenarios());
  const fetchScenariosByProfile = (profileId: string) =>
    dispatch(fetchScenariosByProfileId(profileId));

  const createContextViewAction = (data: CreateContextViewRequest) =>
    dispatch(createContextView(data));
  const updateContextViewAction = (
    id: string,
    data: UpdateContextViewRequest
  ) => dispatch(updateContextView({ id, data }));
  const deleteContextViewAction = (id: string) =>
    dispatch(deleteContextView(id));

  const createScenarioItemAction = (data: CreateScenarioItemRequest) =>
    dispatch(createScenarioItem(data));
  const updateScenarioItemAction = (id: string, data: Partial<ScenarioItem>) =>
    dispatch(updateScenarioItem({ id, data }));
  const deleteScenarioItemAction = (id: string) =>
    dispatch(deleteScenarioItem(id));

  // Error clearing
  const clearScenariosError = () => dispatch(clearError());
  const clearContextViewsErrorAction = () => dispatch(clearContextViewsError());
  const clearScenarioItemsErrorAction = () =>
    dispatch(clearScenarioItemsError());

  // Helper functions
  const getContextViewById = (id: string) => {
    return contextViews.find((cv) => cv.id === id);
  };

  const getScenarioItemById = (id: string) => {
    return scenarioItems.find((si) => si.id === id);
  };

  const getDefaultContextView = () => {
    return contextViews.find((cv) => cv.isDefault);
  };

  return {
    // Data
    scenarios,
    contextViews,
    scenarioItems,
    defaultContextView: getDefaultContextView(),

    // Loading states
    loading,
    contextViewsLoading,
    scenarioItemsLoading,

    // Error states
    error,
    contextViewsError,
    scenarioItemsError,

    // Actions
    fetchScenarios,
    fetchScenariosByProfile,
    createContextView: createContextViewAction,
    updateContextView: updateContextViewAction,
    deleteContextView: deleteContextViewAction,
    createScenarioItem: createScenarioItemAction,
    updateScenarioItem: updateScenarioItemAction,
    deleteScenarioItem: deleteScenarioItemAction,

    // Error clearing
    clearError: clearScenariosError,
    clearContextViewsError: clearContextViewsErrorAction,
    clearScenarioItemsError: clearScenarioItemsErrorAction,

    // Helper functions
    getContextViewById,
    getScenarioItemById,
    getDefaultContextView,
  };
};
