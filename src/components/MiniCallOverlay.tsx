import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCall } from '../data/callContext';
import { mockConversations, mockVets } from '../data/televet';
import { navigationRef } from '../lib/navigationRef';
import { semantic, spacing } from '../theme';
import Text from './Text';

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function MiniCallOverlay() {
  const { state, maximize } = useCall();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const [currentRoute, setCurrentRoute] = useState<{
    name: string;
    params: { conversationId?: string; vetId?: string } | undefined;
  } | null>(null);

  useEffect(() => {
    if (!state.active || !state.minimized) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.active, state.minimized]);

  // Track current route — hide overlay when on Chat screen for the active vet
  useEffect(() => {
    const updateRoute = () => {
      if (!navigationRef.isReady()) return;
      const r = navigationRef.getCurrentRoute();
      if (r) setCurrentRoute({ name: r.name, params: r.params as any });
    };
    updateRoute();
    const unsubscribe = navigationRef.addListener('state', updateRoute);
    return unsubscribe;
  }, []);

  if (!state.active || !state.minimized || !state.vetId) return null;

  // Hide overlay when user is on the Chat screen for the active call's vet
  // (the Chat header itself indicates the active call there)
  if (currentRoute?.name === 'Chat') {
    const conv = mockConversations.find(
      (c) => c.id === currentRoute.params?.conversationId,
    );
    const chatVetId = conv?.vetId ?? currentRoute.params?.vetId;
    if (chatVetId === state.vetId) return null;
  }

  const vet = mockVets.find((v) => v.id === state.vetId);
  if (!vet) return null;

  const duration = state.startedAt
    ? Math.floor((now - state.startedAt) / 1000)
    : 0;

  const onPress = () => {
    maximize();
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('VideoCall', { vetId: state.vetId! });
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: insets.bottom + 100, right: spacing.lg },
        pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
      ]}
    >
      <Image source={{ uri: vet.avatar }} style={styles.avatar} />
      <Text style={styles.duration}>{formatTime(duration)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: 32,
    backgroundColor: semantic.primary,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  duration: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'GoogleSans_600SemiBold',
  },
});
