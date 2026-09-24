import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { GlassCard, PrimaryButton, ui } from './actionlayer-ui';
import { useColors } from '@/hooks/useColors';
import Purchases from 'react-native-purchases';

export function Paywall() {
  const colors = useColors();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    if (Platform.OS === 'web') return; // RevenueCat isn't supported gracefully on web without configuration
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
        setIsPro(true);
      }
    } catch (e) {
      console.warn("RevenueCat Error:", e);
    }
  };

  const handlePurchase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Available on Mobile', 'Please use the mobile app to upgrade to Pro.');
      return;
    }
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
          setIsPro(true);
          Alert.alert('Success', 'You are now an ActionLayer PRO user!');
        }
      } else {
        Alert.alert('Unavailable', 'No packages are currently configured in RevenueCat.');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Error purchasing package', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isPro) {
    return (
      <GlassCard style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>ActionLayer PRO</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Thank you for being a PRO member! You have unlimited AI extractions and evidence analysis.
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>ActionLayer PRO</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Upgrade to PRO to unlock unlimited AI extractions, automated evidence gathering, and priority roadmap generation.
      </Text>
      <View style={{ marginTop: 12 }}>
        <PrimaryButton
          label={loading ? "Processing..." : "Upgrade to Pro"}
          onPress={handlePurchase}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
});
