// ============================================
// Navigation Setup
// ============================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
  type NavigationContainerRef,
} from '@react-navigation/native';
import type { User } from '@supabase/supabase-js';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Linking, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RetrievePasswordScreen } from '../screens/RetrievePasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { PredictScreen } from '../screens/PredictScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { PricingScreen } from '../screens/PricingScreen';
import { WebLandingPage } from '../screens/WebLandingPage';
import { WebLayout, type WebMenuKey, type WebUserMenuAction } from '../components/WebLayout';
import { webDash } from '../theme/webDashboard';
import { supabase } from '../config/supabase';
import { getProfile, signOut } from '../services/authService';

const Stack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Web guest auth: path under app root (supports subpath e.g. /lotto/sign-in). */
function getWebAuthPathRoot(): string {
  if (typeof window === 'undefined') return '';
  let p = window.location.pathname.replace(/\/(sign-in|sign-up|forgot-password)\/?$/i, '');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p === '/' ? '' : p;
}

function buildWebAuthUrl(segment: 'sign-in' | 'sign-up' | 'forgot-password'): string {
  const root = getWebAuthPathRoot();
  const path = root ? `${root}/${segment}` : `/${segment}`;
  return path.replace(/\/+/g, '/');
}

function getWebGuestAuthLinkingPrefixes(): string[] {
  if (typeof window === 'undefined') return [];
  const root = getWebAuthPathRoot();
  const pathPart = root === '' ? '/' : root.endsWith('/') ? root : `${root}/`;
  return [`${window.location.origin}${pathPart}`];
}

function webGuestAuthPathSegment(): string | null {
  if (typeof window === 'undefined') return null;
  const seg = window.location.pathname.split('/').filter(Boolean).pop() ?? '';
  if (seg === 'sign-in' || seg === 'sign-up' || seg === 'forgot-password') return seg;
  return null;
}

function getInitialWebAuthScreenFromUrl(): 'none' | 'login' | 'register' {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'none';
  const seg = webGuestAuthPathSegment();
  if (seg === 'sign-up') return 'register';
  if (seg === 'sign-in' || seg === 'forgot-password') return 'login';
  return 'none';
}

function replaceUrlWithWebLanding(): void {
  if (typeof window === 'undefined') return;
  const root = getWebAuthPathRoot();
  window.history.replaceState({}, '', root === '' ? '/' : root);
}

function pushWebAuthUrl(segment: 'sign-in' | 'sign-up' | 'forgot-password'): void {
  if (typeof window === 'undefined') return;
  window.history.pushState({ ldGuestAuth: segment }, '', buildWebAuthUrl(segment));
}

// ── SVG Icon Components ──
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 25.2 25.2">
    <Path
      d="M2.85,12.74L11.81,3.79c.44-.44,1.15-.44,1.59,0l8.95,8.95M5.1,10.49v10.12c0,.62.5,1.12,1.12,1.12h4.12v-4.88c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v4.88h4.12c.62,0,1.12-.5,1.12-1.12v-10.12M8.85,21.74h8.25"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </Svg>
);

const AnalysisIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 25.2 25.2">
    <Path
      d="M3.23,13.42c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v6.75c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12h0v-6.75ZM9.98,8.92c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v11.25c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12v-11.25ZM16.73,4.42c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v15.75c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12V4.42Z"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </Svg>
);

const PredictIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 25.2 25.2">
    <Path
      d="M10.41,16.5l-.81,2.85-.81-2.85c-.43-1.49-1.6-2.66-3.09-3.09l-2.85-.81,2.85-.81c1.49-.43,2.66-1.6,3.09-3.09l.81-2.85.81,2.85c.43,1.49,1.6,2.66,3.09,3.09l2.85.81-2.85.81c-1.49.43-2.66,1.6-3.09,3.09h0ZM18.86,9.33l-.26,1.03-.26-1.03c-.3-1.21-1.25-2.15-2.45-2.46l-1.04-.26,1.04-.26c1.21-.3,2.15-1.25,2.46-2.46l.26-1.04.26,1.03c.3,1.21,1.25,2.15,2.46,2.46l1.03.26-1.03.26c-1.21.3-2.15,1.25-2.46,2.46h0ZM17.49,21.18l-.39,1.18-.39-1.18c-.22-.67-.75-1.2-1.42-1.42l-1.18-.39,1.18-.39c.67-.22,1.2-.75,1.42-1.42l.39-1.18.39,1.18c.22.67.75,1.2,1.42,1.42l1.18.39-1.18.39c-.67.22-1.2.75-1.42,1.42Z"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </Svg>
);

const DrawingIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 25.2 25.2">
    <Path
      d="M17.1,19.35h-9M17.1,19.35c1.66,0,3,1.34,3,3H5.1c0-1.66,1.34-3,3-3M17.1,19.35v-3.38c0-.62-.5-1.12-1.12-1.12h-.87M8.1,19.35v-3.38c0-.62.5-1.12,1.12-1.12h.87M15.1,14.85h-5.01M15.1,14.85c-.56-.97-.9-2.05-.98-3.17M10.1,14.85c.56-.97.9-2.05.98-3.17M5.85,4.84c-.98.14-1.95.32-2.92.52.46,2.69,2.68,4.73,5.4,4.97M5.85,4.84v.26c0,2.11.97,3.99,2.48,5.23M5.85,4.84v-1.52c2.21-.31,4.46-.47,6.75-.47s4.55.16,6.75.47v1.52M8.33,10.33c.8.66,1.74,1.12,2.75,1.35M19.35,4.84v.26c0,2.11-.97,3.99-2.48,5.23M19.35,4.84c.98.14,1.95.32,2.92.52-.46,2.69-2.68,4.73-5.4,4.97M16.87,10.33c-.8.66-1.74,1.12-2.75,1.35M14.12,11.68c-1,.23-2.04.23-3.04,0"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </Svg>
);

const UserIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 25.2 25.2">
    <Path
      d="M16.35,6.6c0,2.07-1.68,3.75-3.75,3.75s-3.75-1.68-3.75-3.75,1.68-3.75,3.75-3.75,3.75,1.68,3.75,3.75ZM5.1,20.72c.07-4.14,3.48-7.44,7.62-7.38,4.05.07,7.31,3.33,7.38,7.38-2.35,1.08-4.91,1.64-7.5,1.63-2.68,0-5.22-.58-7.5-1.63Z"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </Svg>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: '#FFFFFF',
          paddingTop: Platform.OS === 'ios' ? 28 : 30,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          marginBottom: 16,
          marginHorizontal: 10,
          borderRadius: 14,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: 'Analysis',
          tabBarIcon: ({ color }) => <AnalysisIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Predict"
        component={PredictScreen}
        options={{
          tabBarLabel: 'Predict',
          tabBarIcon: ({ color }) => <PredictIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Drawing',
          tabBarIcon: ({ color }) => <DrawingIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          tabBarLabel: 'My Page',
          tabBarIcon: ({ color }) => <UserIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Pricing"
        component={PricingScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}

function LoggedInWebShell({
  user,
  webNavRef,
  webActiveMenu,
  setWebActiveMenu,
}: {
  user: User;
  webNavRef: React.RefObject<NavigationContainerRef<any> | null>;
  webActiveMenu: WebMenuKey;
  setWebActiveMenu: (m: WebMenuKey) => void;
}) {
  const [accountPlanTier, setAccountPlanTier] = useState<'basic' | 'premium'>('basic');

  useEffect(() => {
    let cancelled = false;
    void getProfile().then((p) => {
      if (cancelled) return;
      setAccountPlanTier(p?.subscription_tier === 'premium' ? 'premium' : 'basic');
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const handleWebMenuPress = (menu: WebMenuKey) => {
    setWebActiveMenu(menu);
    const targetRoute = menu === 'Drawing' ? 'History' : menu;
    webNavRef.current?.navigate(targetRoute);
  };

  const handleLogoPress = () => {
    setWebActiveMenu('Home');
    webNavRef.current?.navigate('Home');
  };

  const handleAccountMenuAction = useCallback(
    (key: WebUserMenuAction) => {
      switch (key) {
        case 'dashboard':
          webNavRef.current?.navigate('MyPage', { focus: 'saved' });
          break;
        case 'account-settings':
          webNavRef.current?.navigate('MyPage', { focus: 'account' });
          break;
        case 'upgrade-premium':
          setWebActiveMenu('Pricing');
          webNavRef.current?.navigate('Pricing');
          break;
        default:
          break;
      }
    },
    [webNavRef]
  );

  const handleAccountSignOut = useCallback(async () => {
    await signOut();
  }, []);

  return (
    <WebLayout
      activeMenu={webActiveMenu}
      onMenuPress={handleWebMenuPress}
      onLogoPress={handleLogoPress}
      accountHeaderMenu={{
        userEmail: user.email ?? '',
        planTier: accountPlanTier,
        onAction: handleAccountMenuAction,
        onSignOut: handleAccountSignOut,
      }}
    >
      <View style={{ flex: 1, minHeight: 0, width: '100%', alignSelf: 'stretch' }}>
        <NavigationContainer
          ref={webNavRef}
          onStateChange={() => {
            const routeName = webNavRef.current?.getCurrentRoute()?.name;
            if (
              routeName === 'Home' ||
              routeName === 'Analysis' ||
              routeName === 'Predict' ||
              routeName === 'Pricing'
            ) {
              setWebActiveMenu(routeName);
            }
            if (routeName === 'History') {
              setWebActiveMenu('Drawing');
            }
          }}
        >
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              sceneStyle: {
                backgroundColor: webDash.screenBg,
                flex: 1,
                minHeight: 0,
              },
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Analysis" component={AnalysisScreen} />
            <Tab.Screen name="Predict" component={PredictScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="MyPage" component={MyPageScreen} />
            <Tab.Screen name="Pricing" component={PricingScreen} />
            <Tab.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Tab.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </WebLayout>
  );
}

export function AppNavigator() {
  const { user, loading, initialized } = useAuth();
  const [webAuthScreen, setWebAuthScreen] = useState<'none' | 'login' | 'register'>(() =>
    getInitialWebAuthScreenFromUrl()
  );
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [webActiveMenu, setWebActiveMenu] = useState<WebMenuKey>('Home');
  const webNavRef = useNavigationContainerRef();
  const webAuthScreenRef = useRef(webAuthScreen);
  webAuthScreenRef.current = webAuthScreen;

  const webGuestAuthLinking = useMemo(
    () =>
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? {
            prefixes: getWebGuestAuthLinkingPrefixes(),
            config: {
              screens: {
                Login: 'sign-in',
                Register: 'sign-up',
                RetrievePassword: 'forgot-password',
              },
            },
          }
        : undefined,
    []
  );

  const closeWebGuestAuth = useCallback(() => {
    replaceUrlWithWebLanding();
    setWebAuthScreen('none');
  }, []);

  const openWebGuestLogin = useCallback(() => {
    pushWebAuthUrl('sign-in');
    setWebAuthScreen('login');
  }, []);

  const openWebGuestRegister = useCallback(() => {
    pushWebAuthUrl('sign-up');
    setWebAuthScreen('register');
  }, []);

  const completePasswordRecovery = useCallback((target: 'toLogin' | 'toApp' = 'toLogin') => {
    setIsPasswordRecovery(false);
    if (target === 'toLogin' && Platform.OS === 'web') {
      pushWebAuthUrl('sign-in');
      setWebAuthScreen('login');
    }
    if (target === 'toApp' && Platform.OS === 'web') {
      replaceUrlWithWebLanding();
      setWebAuthScreen('none');
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onPopState = () => {
      if (webGuestAuthPathSegment() === null && webAuthScreenRef.current !== 'none') {
        setWebAuthScreen('none');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const parseRecovery = (url: string | null | undefined) => {
      if (!url) return;
      if (url.includes('type=recovery')) {
        setIsPasswordRecovery(true);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      parseRecovery(window.location.href);
      parseRecovery(window.location.hash);
    } else {
      Linking.getInitialURL().then(parseRecovery).catch(() => undefined);
      const sub = Linking.addEventListener('url', ({ url }) => parseRecovery(url));
      return () => {
        sub.remove();
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return null; // or splash screen
  }

  if (isPasswordRecovery) {
    return (
      <NavigationContainer>
        <AuthStackNav.Navigator
          initialRouteName="ResetPassword"
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
        >
          <AuthStackNav.Screen name="Login" component={LoginScreen} />
          <AuthStackNav.Screen name="Register" component={RegisterScreen} />
          <AuthStackNav.Screen name="RetrievePassword" component={RetrievePasswordScreen} />
          <AuthStackNav.Screen name="ResetPassword">
            {(props) => (
              <ResetPasswordScreen
                {...props}
                onResetComplete={completePasswordRecovery}
              />
            )}
          </AuthStackNav.Screen>
          <AuthStackNav.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <AuthStackNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </AuthStackNav.Navigator>
      </NavigationContainer>
    );
  }

  // ── Web: show landing page when not logged in ──
  if (Platform.OS === 'web' && !user) {
    if (webAuthScreen === 'login') {
      return (
        <NavigationContainer linking={webGuestAuthLinking}>
          <AuthStackNav.Navigator
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
          >
            <AuthStackNav.Screen name="Login">
              {(props) => <LoginScreen {...props} onBack={closeWebGuestAuth} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="Register">
              {(props) => <RegisterScreen {...props} onBack={closeWebGuestAuth} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="RetrievePassword">
              {(props) => <RetrievePasswordScreen {...props} onBack={closeWebGuestAuth} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="ResetPassword">
              {(props) => <ResetPasswordScreen {...props} onResetComplete={completePasswordRecovery} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <AuthStackNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </AuthStackNav.Navigator>
        </NavigationContainer>
      );
    }
    if (webAuthScreen === 'register') {
      return (
        <NavigationContainer linking={webGuestAuthLinking}>
          <AuthStackNav.Navigator
            initialRouteName="Register"
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
          >
            <AuthStackNav.Screen name="Login">
              {(props) => <LoginScreen {...props} onBack={closeWebGuestAuth} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="Register">
              {(props) => <RegisterScreen {...props} onBack={closeWebGuestAuth} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="RetrievePassword">
              {(props) => <RetrievePasswordScreen {...props} onBack={closeWebGuestAuth} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="ResetPassword">
              {(props) => <ResetPasswordScreen {...props} onResetComplete={completePasswordRecovery} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <AuthStackNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </AuthStackNav.Navigator>
        </NavigationContainer>
      );
    }

    return (
      <WebLandingPage
        onLogin={openWebGuestLogin}
        onRegister={openWebGuestRegister}
      />
    );
  }

  // ── Web logged-in: wrap app with WebLayout ──
  if (Platform.OS === 'web' && user) {
    return (
      <LoggedInWebShell
        user={user}
        webNavRef={webNavRef}
        webActiveMenu={webActiveMenu}
        setWebActiveMenu={setWebActiveMenu}
      />
    );
  }

  // ── Mobile: existing flow ──
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        {/* Always allow guest access to main app */}
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
      <AuthStackNav.Screen name="RetrievePassword" component={RetrievePasswordScreen} />
      <AuthStackNav.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStackNav.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <AuthStackNav.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </AuthStackNav.Navigator>
  );
}
