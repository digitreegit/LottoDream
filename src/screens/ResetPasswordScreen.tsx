// ============================================
// Reset Password Screen
// ============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { signOut, updatePassword } from '../services/authService';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { AppFeedbackModal, type AppFeedbackVariant } from '../components/AppFeedbackModal';
import { landingCtaPrimaryButton, landingCtaPrimaryButtonText } from '../theme/landingCta';

const SHOW_ICON_OUTER_PATH =
  'M385.54,305.32c-.07-.21-.07-.43,0-.64,1.39-4.17,5.32-7.18,9.96-7.18s8.57,3.01,9.96,7.18c.07.21.07.43,0,.64-1.39,4.17-5.32,7.18-9.96,7.18s-8.57-3.01-9.96-7.18h0Z';
const SHOW_ICON_PUPIL_PATH =
  'M398.5,305c0,1.66-1.34,3-3,3s-3-1.34-3-3,1.34-3,3-3,3,1.34,3,3Z';
const HIDE_ICON_PATH =
  'M387.48,301.22c-.94,1.1-1.63,2.39-2.05,3.78,1.29,4.34,5.31,7.5,10.07,7.5.99,0,1.95-.14,2.86-.4M389.73,299.23c1.71-1.13,3.72-1.73,5.77-1.73,4.76,0,8.77,3.16,10.06,7.5-.71,2.37-2.23,4.41-4.29,5.77M389.73,299.23l-3.23-3.23M389.73,299.23l3.65,3.65M401.27,310.77l3.23,3.23M401.27,310.77l-3.65-3.65M397.62,307.12c1.17-1.17,1.17-3.07,0-4.24s-3.07-1.17-4.24,0M397.62,307.12l-4.24-4.24';

export function ResetPasswordScreen({ navigation, onResetComplete }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
    variant: AppFeedbackVariant;
    onConfirm?: () => void;
  } | null>(null);

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setFeedback({
        title: 'Error',
        message: 'Please enter and confirm your new password',
        variant: 'error',
      });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({
        title: 'Error',
        message: 'Password must be at least 6 characters',
        variant: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        title: 'Error',
        message: 'Passwords do not match',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      setFeedback({ title: 'Reset Failed', message: error, variant: 'error' });
      return;
    }

    if (onResetComplete) {
      onResetComplete();
    }

    setFeedback({
      title: 'Success',
      message: 'Password updated successfully.',
      variant: 'success',
      onConfirm: () => onResetComplete?.('toApp'),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <TouchableOpacity style={styles.logoButton} onPress={() => navigation.navigate('Login')}>
          <LottoDreamLogo width={204} />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password</Text>

        <View style={styles.form}>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password (minimum 6 characters)"
              placeholderTextColor="#9CA3AF"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.showHideButton}
              onPress={() => setShowNewPassword((prev) => !prev)}
            >
              {showNewPassword ? (
                <Svg style={styles.showHideSvg} viewBox="385 297 21 16" fill="none">
                  <Path
                    d={HIDE_ICON_PATH}
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                <Svg style={styles.showHideSvg} viewBox="385 297 21 16" fill="none">
                  <Path
                    d={SHOW_ICON_OUTER_PATH}
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={SHOW_ICON_PUPIL_PATH}
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.showHideButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? (
                <Svg style={styles.showHideSvg} viewBox="385 297 21 16" fill="none">
                  <Path
                    d={HIDE_ICON_PATH}
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : (
                <Svg style={styles.showHideSvg} viewBox="385 297 21 16" fill="none">
                  <Path
                    d={SHOW_ICON_OUTER_PATH}
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d={SHOW_ICON_PUPIL_PATH}
                    stroke="#9CA3AF"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={async () => {
              try {
                await signOut();
              } catch {
                // Ignore sign-out errors and still return user to sign-in screen.
              }
              onResetComplete?.('toLogin');
            }}
          >
            <Text style={styles.linkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AppFeedbackModal
        visible={feedback != null}
        title={feedback?.title ?? ''}
        message={feedback?.message ?? ''}
        variant={feedback?.variant ?? 'default'}
        confirmLabel="OK"
        onConfirm={() => {
          const extra = feedback?.onConfirm;
          setFeedback(null);
          extra?.();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center' as any,
  },
  logoButton: {
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  form: {
    gap: 14,
  },
  passwordRow: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 15,
    color: '#000000',
  },
  showHideButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  showHideSvg: {
    width: 20,
    height: 16,
  },
  button: {
    ...landingCtaPrimaryButton,
    marginTop: 8,
  },
  buttonText: landingCtaPrimaryButtonText,
  linkButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#4B5563',
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
