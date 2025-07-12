import { AppDispatch } from "@/store";
import {
  completeUserTaskAsync,
  deleteUserTaskAsync,
  optimisticallyRemoveUserTask,
  restoreUserTask,
} from "@/store/slices/userTaskSlice";
import { UserTask } from "@/types/userTask";
import { actionsByUserTaskType } from "@/utils/userTaskActions";
import { useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import { State } from "react-native-gesture-handler";
import { useDispatch } from "react-redux";

export const useSwipeHandler = () => {
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const swipeAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const dispatch = useDispatch<AppDispatch>();

  const getOrCreateSwipeAnimation = (taskId: string) => {
    if (!swipeAnimations.current[taskId]) {
      swipeAnimations.current[taskId] = new Animated.Value(0);
    }
    return swipeAnimations.current[taskId];
  };

  const handleSwipeEvent = (
    taskId: string,
    translationX: number,
    velocityX: number,
    state: State
  ) => {
    const animation = getOrCreateSwipeAnimation(taskId);

    if (state === State.BEGAN) {
      // Close any other open swipes
      if (swipedTaskId && swipedTaskId !== taskId) {
        const otherAnimation = getOrCreateSwipeAnimation(swipedTaskId);
        Animated.timing(otherAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setSwipedTaskId(null);
      }
    } else if (state === State.ACTIVE) {
      // Update swipe position - allow much more movement
      const clampedTranslation = Math.max(-200, Math.min(200, translationX));
      animation.setValue(clampedTranslation);
      setSwipedTaskId(taskId);
    } else if (state === State.END || state === State.CANCELLED) {
      // Determine if swipe was far enough to trigger action
      const threshold = 100;
      const velocityThreshold = 300;

      if (translationX > threshold || velocityX > velocityThreshold) {
        // Right swipe - Archive
        handleArchiveTask(taskId);
      } else if (translationX < -threshold || velocityX < -velocityThreshold) {
        // Left swipe - Delete
        handleDeleteTask(taskId);
      } else {
        // Reset to original position
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setSwipedTaskId(null);
        });
      }
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      // Note: This would need the userTasks array to be passed in or accessed differently
      // For now, we'll need to handle this in the component that uses this hook
      const animation = getOrCreateSwipeAnimation(taskId);
      Animated.timing(animation, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSwipedTaskId(null);
      });
    } catch (error) {
      // Reset animation on error
      const animation = getOrCreateSwipeAnimation(taskId);
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSwipedTaskId(null);
      });
      Alert.alert("Error", "Failed to archive task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Optimistically remove the task from the store immediately
      dispatch(optimisticallyRemoveUserTask(taskId));

      // Then make the API call
      await dispatch(deleteUserTaskAsync(taskId)).unwrap();

      // Animate out
      const animation = getOrCreateSwipeAnimation(taskId);
      Animated.timing(animation, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSwipedTaskId(null);
      });
    } catch (error) {
      // If the API call fails, restore the task
      dispatch(restoreUserTask(taskId));

      // Reset animation on error
      const animation = getOrCreateSwipeAnimation(taskId);
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSwipedTaskId(null);
      });
      Alert.alert("Error", "Failed to delete task. Please try again.");
    }
  };

  const handleArchiveTaskWithData = async (
    taskId: string,
    userTasks: UserTask[]
  ) => {
    try {
      const task = userTasks.find((t) => t.id === taskId);
      if (!task) return;

      const actionConfig = actionsByUserTaskType[task.type];
      const actionToUse =
        actionConfig.archiveAction || actionConfig.defaultAction || "archive";

      await dispatch(
        completeUserTaskAsync({
          userTaskId: taskId,
          request: {
            options:
              task.actions.length > 0
                ? task.actions.map((action) => ({
                    userTaskActionId: action.id,
                    options: {
                      ignore: !actionConfig.canArchive,
                      action: actionToUse,
                    },
                  }))
                : [
                    {
                      userTaskActionId: "default",
                      options: {
                        ignore: false,
                        action: actionToUse,
                      },
                    },
                  ],
          },
        })
      ).unwrap();

      // Animate out
      const animation = getOrCreateSwipeAnimation(taskId);
      Animated.timing(animation, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSwipedTaskId(null);
      });
    } catch (error) {
      // Reset animation on error
      const animation = getOrCreateSwipeAnimation(taskId);
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSwipedTaskId(null);
      });
      Alert.alert("Error", "Failed to archive task. Please try again.");
    }
  };

  return {
    swipedTaskId,
    getOrCreateSwipeAnimation,
    handleSwipeEvent,
    handleArchiveTaskWithData,
    handleDeleteTask,
  };
};
