import React from 'react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{
        headerShown: false,
        unmountOnBlur: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: {
          height: 84,
          paddingBottom: 26,
          paddingTop: 8,
          backgroundColor: 'rgba(10, 14, 22, 0.72)',
          borderTopColor: 'rgba(255, 255, 255, 0.14)',
          borderTopWidth: 1,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backdropFilter: 'blur(24px) saturate(180%)',
        } as any,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
          </View>
        ),
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="agents" options={{ title: 'Agents', tabBarIcon: ({ color, size }) => <Feather name="layers" color={color} size={size} /> }} />
      <Tabs.Screen name="capture" options={{ title: 'Capture', tabBarIcon: ({ color, size }) => <Feather name="plus-circle" color={color} size={size + 2} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ color, size }) => <Feather name="clock" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }} />
    </Tabs>
  );
}
