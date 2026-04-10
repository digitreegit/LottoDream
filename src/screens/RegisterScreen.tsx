// ============================================
// Register Screen
// ============================================
import React, { useCallback, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSupabaseConfigError } from '../config/constants';
import { signInWithGoogle, signUp } from '../services/authService';
import { getEmailRegistrationError, isValidEmail } from '../utils/validation';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { GoogleSymbol } from '../components/GoogleSymbol';
import { getLastAuthProvider, setLastAuthProvider } from '../utils/authProviderStorage';

export function RegisterScreen({ navigation, onBack }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLastUsedGoogle, setIsLastUsedGoogle] = useState(false);
  const configError = getSupabaseConfigError();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getLastAuthProvider().then((provider) => {
        if (active) {
          setIsLastUsedGoogle(provider === 'google');
        }
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const showNotice = (title: string, message: string, onClose?: () => void) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
      onClose?.();
      return;
    }

    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: onClose,
      },
    ]);
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

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setLoading(true);
    const { error, session } = await signUp(email.trim(), password, '');
    setLoading(false);

    if (error) {
      const registrationError = getEmailRegistrationError(error);
      if (registrationError) {
        setEmailError(registrationError);
        return;
      }
      showNotice('Registration Failed', error);
    } else if (session) {
      showNotice('Welcome!', 'Account created and signed in.', () => {
        if (Platform.OS !== 'web') navigation.navigate('Main');
      });
    } else {
      showNotice(
        'Welcome!',
        'Account created successfully. Please verify your email, then sign in.',
        () => navigation.navigate('Login')
      );
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
    setIsLastUsedGoogle(true);
    await setLastAuthProvider('google');

    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);

    if (error) {
      showNotice('Google Login Failed', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity style={styles.logoButton} onPress={handleLogoPress}>
          <LottoDreamLogo width={170} />
        </TouchableOpacity>

        <Text style={styles.title}>Get started</Text>
        <Text style={styles.subtitle}>Create a new account</Text>

        {configError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Supabase Setup Required</Text>
            <Text style={styles.errorBannerText}>{configError}</Text>
          </View>
        )}

        <View style={styles.googleButtonWrap}>
          {isLastUsedGoogle && (
            <View style={styles.lastUsedBadge}>
              <Text style={styles.lastUsedBadgeText}>LAST USED</Text>
            </View>
          )}
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

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, configError && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || !!configError}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Have an account? <Text style={styles.linkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to LottoDream's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center' as any,
    paddingBottom: 60,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  logoButton: {
    alignSelf: 'center',
    marginBottom: 18,
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
    fontWeight: '600',
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  button: {
    backgroundColor: '#1ABC9C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#718096',
    fontSize: 13,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  googleButtonWrap: {
    position: 'relative',
    marginTop: 8,
    overflow: 'visible',
  },
  googleButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  lastUsedBadge: {
    position: 'absolute',
    right: -10,
    top: -11,
    backgroundColor: '#065F46',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
  },
  lastUsedBadgeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
