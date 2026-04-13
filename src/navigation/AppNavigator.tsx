// ============================================
// Navigation Setup
// ============================================
import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RetrievePasswordScreen } from '../screens/RetrievePasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { PredictScreen } from '../screens/PredictScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { WebLandingPage } from '../screens/WebLandingPage';
import { WebLayout } from '../components/WebLayout';
import { supabase } from '../config/supabase';

const Stack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading, initialized } = useAuth();
  const [webAuthScreen, setWebAuthScreen] = useState<'none' | 'login' | 'register'>('none');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [webActiveMenu, setWebActiveMenu] = useState<'Home' | 'Analysis' | 'Predict' | 'Drawing'>('Home');
  const webNavRef = useNavigationContainerRef();

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
                onResetComplete={() => setIsPasswordRecovery(false)}
              />
            )}
          </AuthStackNav.Screen>
        </AuthStackNav.Navigator>
      </NavigationContainer>
    );
  }

  // ── Web: show landing page when not logged in ──
  if (Platform.OS === 'web' && !user) {
    if (webAuthScreen === 'login') {
      return (
        <NavigationContainer>
          <AuthStackNav.Navigator
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
          >
            <AuthStackNav.Screen name="Login">
              {(props) => <LoginScreen {...props} onBack={() => setWebAuthScreen('none')} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="Register">
              {(props) => <RegisterScreen {...props} onBack={() => setWebAuthScreen('none')} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="RetrievePassword">
              {(props) => <RetrievePasswordScreen {...props} onBack={() => setWebAuthScreen('none')} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="ResetPassword">
              {(props) => <ResetPasswordScreen {...props} onResetComplete={() => setIsPasswordRecovery(false)} />}
            </AuthStackNav.Screen>
          </AuthStackNav.Navigator>
        </NavigationContainer>
      );
    }
    if (webAuthScreen === 'register') {
      return (
        <NavigationContainer>
          <AuthStackNav.Navigator
            initialRouteName="Register"
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}
          >
            <AuthStackNav.Screen name="Login">
              {(props) => <LoginScreen {...props} onBack={() => setWebAuthScreen('none')} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="Register">
              {(props) => <RegisterScreen {...props} onBack={() => setWebAuthScreen('none')} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="RetrievePassword">
              {(props) => <RetrievePasswordScreen {...props} onBack={() => setWebAuthScreen('none')} />}
            </AuthStackNav.Screen>
            <AuthStackNav.Screen name="ResetPassword">
              {(props) => <ResetPasswordScreen {...props} onResetComplete={() => setIsPasswordRecovery(false)} />}
            </AuthStackNav.Screen>
          </AuthStackNav.Navigator>
        </NavigationContainer>
      );
    }

    return (
      <WebLandingPage
        onLogin={() => setWebAuthScreen('login')}
        onRegister={() => setWebAuthScreen('register')}
      />
    );
  }

  // ── Web logged-in: wrap app with WebLayout ──
  if (Platform.OS === 'web' && user) {
    const handleWebMenuPress = (menu: 'Home' | 'Analysis' | 'Predict' | 'Drawing') => {
      setWebActiveMenu(menu);
      const targetRoute = menu === 'Drawing' ? 'History' : menu;
      webNavRef.navigate(targetRoute as never);
    };

    const handleLogoPress = () => {
      setWebActiveMenu('Home');
      webNavRef.navigate('Home' as never);
    };

    const handleProfilePress = () => {
      webNavRef.navigate('MyPage' as never);
    };

    return (
      <WebLayout
        activeMenu={webActiveMenu}
        onMenuPress={handleWebMenuPress}
        onProfilePress={handleProfilePress}
        onLogoPress={handleLogoPress}
      >
        <NavigationContainer
          ref={webNavRef}
          onStateChange={() => {
            const routeName = webNavRef.getCurrentRoute()?.name;
            if (routeName === 'Home' || routeName === 'Analysis' || routeName === 'Predict') {
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
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Analysis" component={AnalysisScreen} />
            <Tab.Screen name="Predict" component={PredictScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="MyPage" component={MyPageScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </WebLayout>
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
    </AuthStackNav.Navigator>
  );
}
