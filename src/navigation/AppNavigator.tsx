// ============================================
// Navigation Setup
// ============================================
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform, Linking } from 'react-native';

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

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B1426',
          borderTopColor: '#1A2744',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#63B3ED',
        tabBarInactiveTintColor: '#4A5568',
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
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: 'Analysis',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Predict"
        component={PredictScreen}
        options={{
          tabBarLabel: 'Predict',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🎯</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          tabBarLabel: 'My Page',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading, initialized } = useAuth();
  const [webAuthScreen, setWebAuthScreen] = useState<'none' | 'login' | 'register'>('none');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

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
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1426' } }}
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
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1426' } }}
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
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B1426' } }}
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
    return (
      <WebLayout onSignOut={() => setWebAuthScreen('none')}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: '#0B1426',
                borderTopColor: '#1A2744',
                borderTopWidth: 1,
                paddingBottom: 8,
                paddingTop: 4,
                height: 60,
              },
              tabBarActiveTintColor: '#63B3ED',
              tabBarInactiveTintColor: '#4A5568',
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen}
              options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }} />
            <Tab.Screen name="Analysis" component={AnalysisScreen}
              options={{ tabBarLabel: 'Analysis', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text> }} />
            <Tab.Screen name="Predict" component={PredictScreen}
              options={{ tabBarLabel: 'Predict', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🎯</Text> }} />
            <Tab.Screen name="History" component={HistoryScreen}
              options={{ tabBarLabel: 'History', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text> }} />
            <Tab.Screen name="MyPage" component={MyPageScreen}
              options={{ tabBarLabel: 'My Page', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
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
          contentStyle: { backgroundColor: '#0B1426' },
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
        contentStyle: { backgroundColor: '#0B1426' },
      }}
    >
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
      <AuthStackNav.Screen name="RetrievePassword" component={RetrievePasswordScreen} />
      <AuthStackNav.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStackNav.Navigator>
  );
}
