// ============================================
// In-app alert / confirm — replaces window.alert, window.confirm, Alert.alert
// ============================================
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { isWebDashboard, webDash, nativeDash } from '../theme/webDashboard';

const C = isWebDashboard ? webDash : nativeDash;

export type AppFeedbackVariant = 'default' | 'error' | 'success' | 'warning';

export type AppFeedbackModalProps = {
  visible: boolean;
  title: string;
  message: string;
  variant?: AppFeedbackVariant;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  confirmLoading?: boolean;
  /** Use for destructive primary actions (e.g. Sign out, Delete) */
  confirmDestructive?: boolean;
};

function variantAccent(variant: AppFeedbackVariant): string {
  switch (variant) {
    case 'error':
      return '#DC2626';
    case 'success':
      return isWebDashboard ? webDash.accent : '#4ADE80';
    case 'warning':
      return '#D97706';
    default:
      return isWebDashboard ? webDash.accent : '#63B3ED';
  }
}

export function AppFeedbackModal({
  visible,
  title,
  message,
  variant = 'default',
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  confirmLoading = false,
  confirmDestructive = false,
}: AppFeedbackModalProps) {
  const isConfirm = Boolean(cancelLabel && onCancel);
  const accent = confirmDestructive ? '#DC2626' : variantAccent(variant);

  const handleRequestClose = () => {
    if (isConfirm) onCancel?.();
    else onConfirm();
  };

  const primaryBg = confirmDestructive ? '#DC2626' : isWebDashboard ? webDash.accent : '#3182CE';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => !confirmLoading && handleRequestClose()}
          accessibilityRole="button"
          accessibilityLabel={isConfirm ? 'Dismiss' : 'Close'}
        />
        <View style={styles.cardWrap} pointerEvents="box-none">
          <View style={styles.card}>
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              {isConfirm ? (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => !confirmLoading && onCancel?.()}
                  disabled={confirmLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnSecondaryText}>{cancelLabel}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  { backgroundColor: primaryBg },
                  confirmLoading && styles.btnPrimaryDisabled,
                ]}
                onPress={() => !confirmLoading && onConfirm()}
                disabled={confirmLoading}
                activeOpacity={0.85}
              >
                {confirmLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...Platform.select({
      web: { zIndex: 999999 },
      default: {},
    }),
  },
  cardWrap: {
    width: '100%' as const,
    maxWidth: 400,
    zIndex: 1,
    ...Platform.select({
      web: { zIndex: 1000000 },
      default: {},
    }),
  },
  card: {
    borderRadius: 16,
    padding: 22,
    paddingTop: 18,
    backgroundColor: isWebDashboard ? '#FFFFFF' : '#1A2744',
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    marginBottom: 22,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.cardBorder : '#4A5568',
    backgroundColor: isWebDashboard ? '#FFFFFF' : 'transparent',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: isWebDashboard ? webDash.textPrimary : '#E2E8F0',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  btnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 108,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  btnPrimaryDisabled: {
    opacity: 0.65,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
