// ============================================
// Login Screen
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
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { signIn } from '../services/authService';
import { getSupabaseConfigError } from '../config/constants';
import { isValidEmail } from '../utils/validation';

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
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const configError = getSupabaseConfigError();

  const showNotice = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
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
      Alert.alert('Error', 'Please enter email and password');
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
      showNotice('Login Failed', error);
      return;
    }

    if (!session) {
      showNotice('Login Failed', 'No active session was created. Please try again.');
      return;
    }

    // On web the auth state change auto-switches the view
    if (Platform.OS !== 'web') {
      navigation.navigate('Main');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {configError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Supabase Setup Required</Text>
            <Text style={styles.errorBannerText}>{configError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => {
            Alert.alert('Info', 'Google login coming soon');
          }}
        >
          <Text style={styles.googleButtonText}>🔵 Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.dividerText}>or</Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, !!emailError && styles.inputError]}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            keyboardType="email-address"
            autoCapitalize="none"
          />
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
            style={[styles.button, configError && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || !!configError}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to Supabase's{' '}
          <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and{' '}
          <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>, and to receive periodic emails with updates.
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
    fontSize: 32,
    fontWeight: '800',
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
    fontWeight: '700',
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
    fontSize: 16,
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
    fontSize: 16,
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
    backgroundColor: '#1ABC9C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  dividerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginVertical: 16,
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
  googleButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
