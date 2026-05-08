import { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';

import { kitchenStyles as styles } from './kitchen-styles';
import type { CookTimerFinishedAlert } from '../contexts/cook-timer-context';
import { useCookTimer } from '../contexts/cook-timer-context';
import type { TimerSoundId } from '../contexts/settings-context';
import { useAppSettings } from '../contexts/settings-context';

const TIMER_SOUND_ASSETS: Record<TimerSoundId, number> = {
  'beep-beep': require('../assets/timer-beep-beep.wav'),
  'soft-chime': require('../assets/timer-soft-chime.wav'),
  'classic-bell': require('../assets/timer-classic-bell.wav'),
  'urgent-alarm': require('../assets/timer-urgent-alarm.wav'),
};

type FinishedTimerAlertCardProps = {
  alert: CookTimerFinishedAlert;
  isWide: boolean;
  onDismiss: (alertId: string) => void;
};

export function CookTimerFinishedAlerts() {
  const { dismissFinishedTimerAlert, finishedTimerAlerts } = useCookTimer();
  const { allowVibration, palette, timerSound } = useAppSettings();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const player = useAudioPlayer(TIMER_SOUND_ASSETS[timerSound]);
  const previousAlertCountRef = useRef(0);

  useEffect(() => {
    const previousAlertCount = previousAlertCountRef.current;

    if (finishedTimerAlerts.length === 0) {
      try {
        player.pause();
        player.loop = false;
        void player.seekTo(0);
      } catch {}

      Vibration.cancel();
      previousAlertCountRef.current = 0;
      return;
    }

    try {
      player.loop = true;

      if (finishedTimerAlerts.length > previousAlertCount) {
        void player.seekTo(0);
      }

      player.play();
    } catch {}

    if (
      allowVibration &&
      (Platform.OS === 'ios' || Platform.OS === 'android') &&
      finishedTimerAlerts.length > previousAlertCount
    ) {
      Vibration.vibrate([0, 220, 120, 220]);
    }

    previousAlertCountRef.current = finishedTimerAlerts.length;
  }, [allowVibration, finishedTimerAlerts.length, player]);

  useEffect(
    () => () => {
      try {
        player.pause();
        player.loop = false;
      } catch {}

      Vibration.cancel();
    },
    [player]
  );

  if (finishedTimerAlerts.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.timerAlertOverlay}>
      <View
        pointerEvents="box-none"
        style={[
          styles.timerAlertStack,
          {
            width: isWide ? 420 : Math.min(width - 24, 320),
          },
        ]}
      >
        {finishedTimerAlerts.map((alert) => (
          <FinishedTimerAlertCard
            key={alert.id}
            alert={alert}
            isWide={isWide}
            onDismiss={dismissFinishedTimerAlert}
          />
        ))}
      </View>
    </View>
  );
}

function FinishedTimerAlertCard({ alert, isWide, onDismiss }: FinishedTimerAlertCardProps) {
  const { palette } = useAppSettings();
  const translateX = useRef(new Animated.Value(-360)).current;
  const dismissingRef = useRef(false);
  const dismissDistance = isWide ? 520 : 380;
  const dismissThreshold = isWide ? 92 : 72;
  const dismissDuration = Platform.OS === 'web' ? 280 : 180;

  const dismiss = (direction: number) => {
    if (dismissingRef.current) {
      return;
    }

    dismissingRef.current = true;
    Animated.timing(translateX, {
      toValue: direction * dismissDistance,
      duration: dismissDuration,
      useNativeDriver: true,
    }).start(() => onDismiss(alert.id));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);

        if (Math.abs(gestureState.dx) >= dismissThreshold) {
          dismiss(gestureState.dx >= 0 ? 1 : -1);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!dismissingRef.current && Math.abs(gestureState.dx) >= dismissThreshold) {
          dismiss(gestureState.dx >= 0 ? 1 : -1);
          return;
        }

        Animated.spring(translateX, {
          toValue: 0,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: 0,
      damping: 17,
      stiffness: 170,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.timerAlertCard,
        isWide && styles.timerAlertCardWide,
        {
          backgroundColor: palette.elevated,
          borderColor: palette.borderAlt,
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.timerAlertHeader}>
        <View style={styles.timerAlertCopy}>
          <Text numberOfLines={1} style={[styles.timerAlertTitle, { color: palette.text }]}>
            {alert.timerName}
          </Text>
          <Text style={[styles.timerAlertStatus, { color: palette.accentText }]}>
            Timer finished
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => dismiss(-1)}
        style={[
          styles.timerAlertDismissButton,
          {
            backgroundColor: palette.accent,
          },
        ]}
      >
        <Text style={[styles.timerAlertDismissText, { color: palette.accentContrastText }]}>
          Dismiss
        </Text>
      </Pressable>
    </Animated.View>
  );
}
