// ============================================
// Login Screen
// ============================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { signIn, signInWithGoogle } from '../services/authService';
import { getSupabaseConfigError } from '../config/constants';
import { isValidEmail } from '../utils/validation';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { GoogleSymbol } from '../components/GoogleSymbol';
import { AuthNoticeBanner, type AuthNoticeVariant } from '../components/AuthNoticeBanner';
import {
  landingCtaPrimaryButton,
  landingCtaPrimaryButtonDisabled,
  landingCtaPrimaryButtonText,
} from '../theme/landingCta';
import {
  getLastAuthMethod,
  setLastAuthMethod,
  type LastAuthMethod,
} from '../services/lastAuthMethodStorage';

const SHOW_ICON_OUTER_PATH =
  'M385.54,305.32c-.07-.21-.07-.43,0-.64,1.39-4.17,5.32-7.18,9.96-7.18s8.57,3.01,9.96,7.18c.07.21.07.43,0,.64-1.39,4.17-5.32,7.18-9.96,7.18s-8.57-3.01-9.96-7.18h0Z';
const SHOW_ICON_PUPIL_PATH =
  'M398.5,305c0,1.66-1.34,3-3,3s-3-1.34-3-3,1.34-3,3-3,3,1.34,3,3Z';
const HIDE_ICON_PATH =
  'M387.48,301.22c-.94,1.1-1.63,2.39-2.05,3.78,1.29,4.34,5.31,7.5,10.07,7.5.99,0,1.95-.14,2.86-.4M389.73,299.23c1.71-1.13,3.72-1.73,5.77-1.73,4.76,0,8.77,3.16,10.06,7.5-.71,2.37-2.23,4.41-4.29,5.77M389.73,299.23l-3.23-3.23M389.73,299.23l3.65,3.65M401.27,310.77l3.23,3.23M401.27,310.77l-3.65-3.65M397.62,307.12c1.17-1.17,1.17-3.07,0-4.24s-3.07-1.17-4.24,0M397.62,307.12l-4.24-4.24';

export function LoginScreen({ navigation, onBack }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const configError = getSupabaseConfigError();

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

  const [lastUsedMethod, setLastUsedMethod] = useState<LastAuthMethod | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void getLastAuthMethod().then((m) => {
        if (!cancelled) setLastUsedMethod(m);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      presentAuthNotice({
        variant: 'warning',
        title: 'Missing information',
        message: 'Please enter email and password.',
      });
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setLoading(true);
    const { error, session } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      presentAuthNotice({ variant: 'error', title: 'Login Failed', message: error });
      return;
    }

    if (!session) {
      presentAuthNotice({
        variant: 'error',
        title: 'Login Failed',
        message: 'No active session was created. Please try again.',
      });
      return;
    }

    void setLastAuthMethod('email');

    // On web the auth state change auto-switches the view
    if (Platform.OS !== 'web') {
      navigation.navigate('Main');
    }
  };

  const handleLogoPress = () => {
    if (Platform.OS === 'web' && onBack) {
      onBack();
      return;
    }
    navigation.navigate('Login');
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);

    if (error) {
      presentAuthNotice({ variant: 'error', title: 'Google Login Failed', message: error });
      return;
    }
    void setLastAuthMethod('google');
  };

  const canSubmitEmailPassword = useMemo(
    () =>
      email.trim().length > 0 &&
      password.length > 0 &&
      isValidEmail(email.trim()),
    [email, password]
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

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {configError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Supabase Setup Required</Text>
            <Text style={styles.errorBannerText}>{configError}</Text>
          </View>
        )}

        <View style={styles.googleButtonWrap}>
          {lastUsedMethod === 'google' ? (
            <Text style={[styles.lastUsedLabel, styles.lastUsedOnGoogle]} pointerEvents="none">
              LAST USED
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={googleLoading || !!configError}
          >
            {googleLoading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <View style={styles.googleButtonContent}>
                <GoogleSymbol size={20} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <View
            style={[styles.inputShell, lastUsedMethod === 'email' && styles.inputShellBadgeRoom]}
          >
            {lastUsedMethod === 'email' ? (
              <Text style={[styles.lastUsedLabel, styles.lastUsedOnEmail]} pointerEvents="none">
                LAST USED
              </Text>
            ) : null}
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
          </View>
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.showHideButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
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
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('RetrievePassword', { email })}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              ((!canSubmitEmailPassword || !!configError) && !loading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading || !!configError || !canSubmitEmailPassword}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
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
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center' as any,
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
  logoButton: {
    alignSelf: 'center',
    marginBottom: 18,
  },
  form: {
    gap: 14,
  },
  inputShell: {
    position: 'relative',
  },
  inputShellBadgeRoom: {
    paddingTop: 6,
  },
  lastUsedLabel: {
    position: 'absolute',
    zIndex: 2,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.35,
    color: '#111827',
    backgroundColor: '#C8F0E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 131, 0.28)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  /** Half the pill sits above the control edge (Supabase-style) */
  lastUsedOnGoogle: {
    top: -5,
    right: -10,
  },
  lastUsedOnEmail: {
    top: -5,
    right: -10,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPasswordText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  button: {
    ...landingCtaPrimaryButton,
    marginTop: 16,
  },
  buttonDisabled: landingCtaPrimaryButtonDisabled,
  buttonText: landingCtaPrimaryButtonText,
  linkButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#718096',
    fontSize: 13,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  linkBold: {
    fontWeight: '600',
    color: '#000000',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
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
  googleButtonWrap: {
    marginTop: 8,
    paddingTop: 6,
    position: 'relative',
  },
  googleButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
