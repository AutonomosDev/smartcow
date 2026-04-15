import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Share2, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function FindingDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || { id: '1' };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Overlay */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={T.color.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detección IA #148</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Share2 size={24} color={T.color.white} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Image with AI Bounding Box UI */}
          <View style={styles.imageContainer}>
            <View style={styles.mainImagePlaceholder}>
              <Target size={48} color="rgba(255,255,255,0.2)" />
              {/* Simulated Bounding Box */}
              <View style={styles.boundingBox}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <View style={styles.labelContainer}>
                  <Text style={styles.boxLabel}>BEBEDERO VACÍO 99.2%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>Bebedero vacío</Text>
                <Text style={styles.subtitle}>Potrero Sur · 08:14 AM</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>99.2% Confidencialidad</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>COORDENADAS</Text>
                <Text style={styles.infoValue}>-40.574, -73.123</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>ALTITUD CAPTURA</Text>
                <Text style={styles.infoValue}>22.5 m</Text>
              </View>
            </View>

            <View style={styles.descriptionCard}>
              <Info size={18} color={T.color.text.muted} />
              <Text style={styles.descriptionText}>
                La red neuronal detectó un bebedero sin reflejo de agua y con borde seco visible. Comparado con histórico del lunes, el nivel bajó un 100%.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.alertBtn}
                onPress={() => navigation.navigate('AlertDetail', { alertId: '1' })}
              >
                <AlertTriangle size={20} color="#fff" />
                <Text style={styles.alertBtnText}>Generar Alerta Urgente</Text>
              </TouchableOpacity>
              
              <View style={styles.secondaryActions}>
                <TouchableOpacity style={styles.secBtn}>
                  <CheckCircle size={20} color={T.color.primary} />
                  <Text style={styles.secBtnText}>Es correcto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secBtn}>
                  <AlertTriangle size={20} color="#e67e22" />
                  <Text style={[styles.secBtnText, { color: '#e67e22' }]}>Falso positivo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: T.font.family.medium,
    fontSize: 14,
    color: T.color.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#1a1a1a',
  },
  mainImagePlaceholder: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boundingBox: {
    position: 'absolute',
    width: 200,
    height: 150,
    borderWidth: 2,
    borderColor: '#e74c3c',
    top: 100,
    left: 80,
  },
  cornerTL: { position: 'absolute', top: -4, left: -4, width: 15, height: 15, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerTR: { position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  cornerBL: { position: 'absolute', bottom: -4, left: -4, width: 15, height: 15, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerBR: { position: 'absolute', bottom: -4, right: -4, width: 15, height: 15, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  labelContainer: {
    position: 'absolute',
    top: -24,
    left: -2,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  boxLabel: {
    color: '#fff',
    fontSize: 10,
    fontFamily: T.font.family.semibold,
  },
  detailsSection: {
    flex: 1,
    backgroundColor: T.color.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  confidenceBadge: {
    backgroundColor: '#e6f3ec',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#1e3a2f',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: T.color.white,
    borderRadius: 16,
    padding: 16,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  descriptionCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f6f1',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: T.font.family.regular,
    color: T.color.text.primary,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  alertBtn: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  alertBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secBtn: {
    flex: 1,
    height: 50,
    backgroundColor: T.color.white,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ecebe6',
  },
  secBtnText: {
    fontSize: 13,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
});
