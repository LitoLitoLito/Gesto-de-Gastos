import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIAS = ['Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Otros'];
const FILTROS = ['Todas', ...CATEGORIAS];

const COLORES = {
  Alimentación: '#F59E0B',
  Transporte: '#3B82F6',
  Entretenimiento: '#A855F7',
  Salud: '#10B981',
  Otros: '#6B7280',
};

const formatearPesos = (n) =>
  '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [filtro, setFiltro] = useState('Todas');
  const [error, setError] = useState('');
  const [cargado, setCargado] = useState(false);

  // 1. Cargar datos al iniciar
  useEffect(() => {
    const cargarGastos = async () => {
      try {
        const guardado = await AsyncStorage.getItem('gastos');
        if (guardado !== null) {
          setGastos(JSON.parse(guardado));
        }
      } catch (e) {
        console.log('Error al cargar los gastos', e);
      } finally {
        setCargado(true);
      }
    };
    cargarGastos();
  }, []);

  // 2. Guardar datos solo cuando ya se cargaron por primera vez
  useEffect(() => {
    if (!cargado) return;
    
    AsyncStorage.setItem('gastos', JSON.stringify(gastos)).catch((e) =>
      console.log('Error al guardar los gastos', e)
    );
  }, [gastos, cargado]);

  const agregarGasto = () => {
    const montoLimpio = monto.trim();

    if (descripcion.trim() === '') {
      setError('Ingresá una descripción.');
      return;
    }

    if (!/^\d+$/.test(montoLimpio) || Number(montoLimpio) <= 0) {
      setError('Ingresá un monto válido (solo números enteros mayores a 0).');
      return;
    }

    const nuevo = {
      id: Date.now().toString(),
      descripcion: descripcion.trim(),
      monto: Number(montoLimpio),
      categoria,
    };
    setGastos([nuevo, ...gastos]);
    setDescripcion('');
    setMonto('');
    setError('');
  };

  const eliminarGasto = (id) => {
    setGastos(gastos.filter((g) => g.id !== id));
  };

  const gastosFiltrados =
    filtro === 'Todas' ? gastos : gastos.filter((g) => g.categoria === filtro);

  const total = gastos.reduce((acum, g) => acum + g.monto, 0);

  const gastoMasAlto =
    gastos.length > 0
      ? gastos.reduce((max, g) => (g.monto > max.monto ? g : max))
      : null;

  const totalPorCategoria = CATEGORIAS.map((cat) => ({
    categoria: cat,
    total: gastos
      .filter((g) => g.categoria === cat)
      .reduce((acum, g) => acum + g.monto, 0),
  })).filter((item) => item.total > 0);

  // Opcional: Evitar renderizar antes de leer el almacenamiento para prevenir parpadeos
  if (!cargado) {
    return null; // O un componente de carga <View><ActivityIndicator /></View>
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Gestor de gastos</Text>
        <Text style={styles.totalLabel}>Total gastado</Text>
        <Text style={styles.totalMonto}>{formatearPesos(total)}</Text>
        <Text style={styles.headerInfo}>
          {gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'}
          {gastoMasAlto
            ? `  ·  Mayor: ${gastoMasAlto.descripcion} (${formatearPesos(gastoMasAlto.monto)})`
            : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.card}>
          <Text style={styles.seccion}>Nuevo gasto</Text>

          <TextInput
            style={styles.input}
            placeholder="Descripción (ej: Supermercado)"
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TextInput
            style={styles.input}
            placeholder="Monto (ej: 15000)"
            keyboardType="numeric"
            value={monto}
            onChangeText={setMonto}
          />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chips}>
            {CATEGORIAS.map((cat) => {
              const activa = categoria === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategoria(cat)}
                  style={[
                    styles.chip,
                    activa && { backgroundColor: COLORES[cat], borderColor: COLORES[cat] },
                  ]}
                >
                  <Text style={[styles.chipTexto, activa && { color: 'white' }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.botonAgregar} onPress={agregarGasto}>
            <Text style={styles.botonAgregarTexto}>+ Agregar gasto</Text>
          </Pressable>
        </View>

        {totalPorCategoria.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.seccion}>Gasto por categoría</Text>
            {totalPorCategoria.map((item) => (
              <View key={item.categoria} style={styles.filaResumen}>
                <View style={styles.filaResumenIzq}>
                  <View style={[styles.punto, { backgroundColor: COLORES[item.categoria] }]} />
                  <Text style={styles.resumenTexto}>{item.categoria}</Text>
                </View>
                <Text style={styles.resumenMonto}>{formatearPesos(item.total)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.seccion}>Mis gastos</Text>
          <View style={styles.chips}>
            {FILTROS.map((cat) => {
              const activa = filtro === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setFiltro(cat)}
                  style={[styles.chip, activa && styles.chipFiltroActivo]}
                >
                  <Text style={[styles.chipTexto, activa && { color: 'white' }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>

          {gastosFiltrados.length === 0 ? (
            <Text style={styles.vacio}>
              {gastos.length === 0
                ? 'Todavía no cargaste ningún gasto.'
                : 'No hay gastos en esta categoría.'}
            </Text>
          ) : (
            gastosFiltrados.map((g) => (
              <View key={g.id} style={styles.item}>
                <View style={[styles.barra, { backgroundColor: COLORES[g.categoria] }]} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDescripcion}>{g.descripcion}</Text>
                  <Text style={styles.itemDetalle}>
                    {formatearPesos(g.monto)} - {g.categoria}
                  </Text>
                </View>
                <Pressable style={styles.botonEliminar} onPress={() => eliminarGasto(g.id)}>
                  <Text style={styles.botonEliminarTexto}>Eliminar</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitulo: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  totalLabel: { color: '#C7D2FE', fontSize: 14 },
  totalMonto: { color: 'white', fontSize: 38, fontWeight: 'bold' },
  headerInfo: { color: '#C7D2FE', fontSize: 13, marginTop: 6 },
  contenido: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  seccion: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  label: { fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  chipFiltroActivo: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipTexto: { color: '#374151', fontSize: 14 },
  error: { color: '#DC2626', marginBottom: 10, fontSize: 14 },
  botonAgregar: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonAgregarTexto: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  filaResumenIzq: { flexDirection: 'row', alignItems: 'center' },
  punto: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  resumenTexto: { fontSize: 15, color: '#374151' },
  resumenMonto: { fontSize: 15, fontWeight: '600', color: '#111827' },
  vacio: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  barra: { width: 6, alignSelf: 'stretch' },
  itemInfo: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  itemDescripcion: { fontSize: 16, fontWeight: '600', color: '#111827' },
  itemDetalle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  botonEliminar: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  botonEliminarTexto: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
});