import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const MOCK_ITEMS = [
  { desc: 'Ensilaje maíz', qty: '8.000 kg', val: '$1.040.000' },
  { desc: 'Flete',         qty: '1 viaje',  val: '$120.000' },
  { desc: 'Descarga',      qty: '—',        val: '$80.000' },
];

export default function InvoiceDetailScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrRight}>Factura</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Título */}
          <Text style={s.title}>Detalle gasto</Text>
          <Text style={s.subtitle}>Lote Norte · 8 abril 2026</Text>

          {/* Hero card blanca — proveedor y monto */}
          <View style={s.heroCard}>
            <Text style={s.heroCategory}>ALIMENTACIÓN</Text>
            <Text style={s.heroInvoiceTitle}>Ensilaje maíz — Reposición</Text>
            <Text style={s.heroAmount}>$1.240.000</Text>
            <Text style={s.heroProvider}>Proveedor: Agroinsumos Del Sur</Text>
          </View>

          {/* Info grid 2-col */}
          <View style={s.infoCard}>
            {[
              { label: 'Fecha',      val: '8 abr' },
              { label: 'N° factura', val: 'F-00421' },
              { label: 'Lote',       val: 'Norte' },
              { label: '$/animal',   val: '$11.272' },
            ].map((item, i) => (
              <View key={i} style={[s.infoCell, i % 2 === 0 && s.infoCellBorder]}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoVal}>{item.val}</Text>
              </View>
            ))}
          </View>

          {/* Ítems */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Ítems</Text>
            <View style={s.divider} />
            {MOCK_ITEMS.map((item, i) => (
              <View key={i} style={[s.itemRow, i < MOCK_ITEMS.length - 1 && s.itemRowBorder]}>
                <Text style={s.itemDesc}>{item.desc}</Text>
                <Text style={s.itemQty}>{item.qty}</Text>
                <Text style={s.itemVal}>{item.val}</Text>
              </View>
            ))}
          </View>

          {/* Total CTA */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total factura</Text>
            <Text style={s.totalVal}>$1.240.000</Text>
          </View>

          {/* Acción secundaria */}
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={s.secondaryBtnText}>Asignar a otro lote</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  hdrRight: { fontFamily: F.r, fontSize: 11, color: '#888' },

  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },

  // Hero card blanca facturas
  heroCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8,
  },
  heroCategory: { fontFamily: F.b, fontSize: 9, color: '#888', letterSpacing: 1, marginBottom: 4 },
  heroInvoiceTitle: { fontFamily: F.b, fontSize: 15, color: '#1a1a1a', marginBottom: 6 },
  heroAmount: { fontFamily: F.b, fontSize: 28, color: '#1a1a1a', marginBottom: 4 },
  heroProvider: { fontFamily: F.r, fontSize: 11, color: '#888' },

  // Info grid
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14,
    flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8,
  },
  infoCell: { width: '50%', paddingVertical: 10, paddingHorizontal: 14 },
  infoCellBorder: { borderRightWidth: 0.5, borderRightColor: '#f0ede8' },
  infoLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 2 },
  infoVal:   { fontFamily: F.b, fontSize: 13, color: '#1a1a1a' },

  // Ítems card
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  itemRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  itemDesc: { fontFamily: F.r, fontSize: 12, color: '#1a1a1a', flex: 1 },
  itemQty:  { fontFamily: F.r, fontSize: 12, color: '#888', width: 60, textAlign: 'center' },
  itemVal:  { fontFamily: F.b, fontSize: 12, color: '#1a1a1a', width: 80, textAlign: 'right' },

  // Total
  totalRow: {
    backgroundColor: '#1e3a2f', borderRadius: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, marginBottom: 8,
  },
  totalLabel: { fontFamily: F.m, fontSize: 13, color: '#fff' },
  totalVal:   { fontFamily: F.b, fontSize: 16, color: '#fff' },

  // Secondary
  secondaryBtn: {
    borderWidth: 1, borderColor: '#1e3a2f', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: F.m, fontSize: 13, color: '#1e3a2f' },
});
