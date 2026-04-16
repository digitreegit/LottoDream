// ============================================
// Retrieve Password Screen
// ============================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { requestPasswordReset } from '../services/authService';
import { isValidEmail } from '../utils/validation';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { AuthNoticeBanner, type AuthNoticeVariant } from '../components/AuthNoticeBanner';
import {
  landingCtaPrimaryButton,
  landingCtaPrimaryButtonDisabled,
  landingCtaPrimaryButtonText,
} from '../theme/landingCta';

export function RetrievePasswordScreen({ navigation, route, onBack }: any) {
  const initialEmail = useMemo(() => route?.params?.email || '', [route?.params?.email]);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  type AuthScreenNotice = {
    variant: AuthNoticeVariant;
    title: string;
    message: string;
    onDismiss?: () => void;
    autoDismissMs?: number | null;
  };
  const [authNotice, setAuthNotice] = useState<AuthScreenNotice | null>(null);
  const authNoticeRef = useRef<AuthScreenNotice | null>(null);
  authNoticeRef.current = authNotice;

  const dismissAuthNotice = useCallback(() => {
    const n = authNoticeRef.current;
    setAuthNotice(null);
    n?.onDismiss?.();
  }, []);

  const presentAuthNotice = (p: AuthScreenNotice) => {
    setAuthNotice(p);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    const trimmedValue = email.trim();
    if (!trimmedValue) {
      setEmailError('');
      return;
    }
    setEmailError(isValidEmail(trimmedValue) ? '' : 'Enter a valid email address');
  };

  const handleResetRequest = async () => {
    if (!email.trim()) {
      presentAuthNotice({
        variant: 'warning',
        title: 'Email required',
        message: 'Please enter your email address.',
      });
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await requestPasswordReset(email.trim());
    setLoading(false);

    if (error) {
      presentAuthNotice({ variant: 'error', title: 'Request Failed', message: error });
      return;
    }

    presentAuthNotice({
      variant: 'success',
      title: 'Check your email',
      message: 'A password reset link has been sent. Open the link in your email to continue.',
    });
  };

  const handleLogoPress = () => {
    if (Platform.OS === 'web' && onBack) {
      onBack();
      return;
    }
    navigation.navigate('Login');
  };

  const canSubmitForgot = useMemo(
    () => email.trim().length > 0 && isValidEmail(email.trim()),
    [email]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {authNotice && (
          <AuthNoticeBanner
            variant={authNotice.variant}
            title={authNotice.title}
            message={authNotice.message}
            onDismiss={dismissAuthNotice}
            autoDismissMs={authNotice.autoDismissMs}
          />
        )}
        <TouchableOpacity style={styles.logoButton} onPress={handleLogoPress}>
          <LottoDreamLogo width={204} />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a code to reset the password</Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, !!emailError && styles.inputError]}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

          <TouchableOpacity
            style={[styles.button, !canSubmitForgot && !loading && styles.buttonDisabled]}
            onPress={handleResetRequest}
            disabled={loading || !canSubmitForgot}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to LottoDream's{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('TermsOfService')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
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
    paddingVertical: 40,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center' as any,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  logoButton: {
    alignSelf: 'center',
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    marginTop: -8,
    fontSize: 12,
    color: '#DC2626',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  button: {
    ...landingCtaPrimaryButton,
    marginTop: 20,
  },
  buttonDisabled: landingCtaPrimaryButtonDisabled,
  buttonText: landingCtaPrimaryButtonText,
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  footerLink: {
    color: '#9CA3AF',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#718096',
    fontSize: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  linkBold: {
    fontWeight: '600',
    color: '#000000',
  },
});
