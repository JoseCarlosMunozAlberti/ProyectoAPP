import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, TABLES } from '../../supabase';
import type { Transaccion, Categoria } from '../../supabase';

type MaterialIconName = 'attach-money' | 'work' | 'business' | 'card-giftcard' | 'account-balance' | 'savings' | 'more-horiz' | 'add' | 'restaurant' | 'directions-car' | 'movie' | 'build' | 'shopping-cart';

type CategoriaExtendida = Categoria & { 
  icono: MaterialIconName; 
  color: string; 
  descripcion: string;
};

type TipoTransaccion = 'ingreso' | 'egreso';

type IconosPorCategoria = {
  [key in TipoTransaccion]: {
    [key: string]: MaterialIconName;
  };
};

type ColoresPorCategoria = {
  [key in TipoTransaccion]: {
    [key: string]: string;
  };
};

type DescripcionesPorCategoria = {
  [key in TipoTransaccion]: {
    [key: string]: string;
  };
};

type TransaccionConCategoria = Transaccion & {
  categorias: Categoria;
};

// Categorías predefinidas
const CATEGORIAS_DEFAULT = [
  { nombre: 'Salario', tipo: 'ingreso' },
  { nombre: 'Inversiones', tipo: 'ingreso' },
  { nombre: 'Regalos', tipo: 'ingreso' },
  { nombre: 'Freelance', tipo: 'ingreso' },
  { nombre: 'Ahorros', tipo: 'ingreso' },
  { nombre: 'Otros', tipo: 'ingreso' },
  { nombre: 'Comida', tipo: 'egreso' },
  { nombre: 'Transporte', tipo: 'egreso' },
  { nombre: 'Entretenimiento', tipo: 'egreso' },
  { nombre: 'Servicios', tipo: 'egreso' },
  { nombre: 'Compras', tipo: 'egreso' },
  { nombre: 'Otros', tipo: 'egreso' },
];

export default function WelcomeScreen() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTransaccion>('ingreso');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaExtendida | null>(null);
  const [categorias, setCategorias] = useState<CategoriaExtendida[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionConCategoria[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [animation] = useState(new Animated.Value(0));

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      inicializarCategorias();
      cargarDatos();
    }
  }, [user]);

  const inicializarCategorias = async () => {
    try {
      // Verificar si ya existen categorías
      const { data: categoriasExistentes, error: errorConsulta } = await supabase
        .from(TABLES.CATEGORIAS)
        .select('*');

      if (errorConsulta) throw errorConsulta;

      // Si no hay categorías, insertar las predefinidas
      if (!categoriasExistentes || categoriasExistentes.length === 0) {
        const { error: errorInsercion } = await supabase
          .from(TABLES.CATEGORIAS)
          .insert(CATEGORIAS_DEFAULT);

        if (errorInsercion) throw errorInsercion;
        console.log('Categorías predefinidas insertadas correctamente');
      }
    } catch (error) {
      console.error('Error inicializando categorías:', error);
      Alert.alert('Error', 'No se pudieron inicializar las categorías');
    }
  };

  const cargarDatos = async () => {
    try {
      setLoadingDatos(true);
      
      // Cargar categorías desde la base de datos
      const { data: categoriasData, error: categoriasError } = await supabase
        .from(TABLES.CATEGORIAS)
        .select('*')
        .order('nombre');

      if (categoriasError) throw categoriasError;

      console.log('Categorías cargadas:', categoriasData); // Debug

      // Mapear categorías con iconos y colores
      const iconosPorTipo: IconosPorCategoria = {
        ingreso: {
          'Salario': 'work',
          'Inversiones': 'business',
          'Regalos': 'card-giftcard',
          'Freelance': 'attach-money',
          'Ahorros': 'savings',
          'Otros': 'more-horiz',
        },
        egreso: {
          'Comida': 'restaurant',
          'Transporte': 'directions-car',
          'Entretenimiento': 'movie',
          'Servicios': 'build',
          'Compras': 'shopping-cart',
          'Otros': 'more-horiz',
        }
      };

      const coloresPorTipo: ColoresPorCategoria = {
        ingreso: {
          'Salario': '#4CAF50',
          'Inversiones': '#2196F3',
          'Regalos': '#9C27B0',
          'Freelance': '#FF9800',
          'Ahorros': '#00BCD4',
          'Otros': '#607D8B',
        },
        egreso: {
          'Comida': '#FF6B6B',
          'Transporte': '#4ECDC4',
          'Entretenimiento': '#45B7D1',
          'Servicios': '#96CEB4',
          'Compras': '#D4A5A5',
          'Otros': '#6B717E',
        }
      };

      const descripcionesPorTipo: DescripcionesPorCategoria = {
        ingreso: {
          'Salario': 'Sueldo, bonos, horas extras',
          'Inversiones': 'Dividendos, intereses, rentas',
          'Regalos': 'Obsequios, premios, herencias',
          'Freelance': 'Trabajos independientes',
          'Ahorros': 'Retiros de ahorros, plazos fijos',
          'Otros': 'Otros ingresos',
        },
        egreso: {
          'Comida': 'Restaurantes, mercado, delivery',
          'Transporte': 'Gasolina, pasajes, mantenimiento',
          'Entretenimiento': 'Cine, eventos, actividades',
          'Servicios': 'Luz, agua, internet',
          'Compras': 'Ropa, tecnología, accesorios',
          'Otros': 'Otros gastos',
        }
      };

      const categoriasExtendidas: CategoriaExtendida[] = categoriasData.map(cat => {
        const tipo = cat.tipo as TipoTransaccion;
        return {
          ...cat,
          icono: iconosPorTipo[tipo]?.[cat.nombre] || 'more-horiz',
          color: coloresPorTipo[tipo]?.[cat.nombre] || '#607D8B',
          descripcion: descripcionesPorTipo[tipo]?.[cat.nombre] || 'Sin descripción'
        };
      });

      console.log('Categorías extendidas:', categoriasExtendidas); // Debug
      setCategorias(categoriasExtendidas);

      // Cargar transacciones
      const { data: transaccionesData, error: transaccionesError } = await supabase
        .from(TABLES.TRANSACCIONES)
        .select(`
          *,
          categorias (*)
        `)
        .eq('usuario_id', user?.id)
        .order('fecha', { ascending: false });

      if (transaccionesError) throw transaccionesError;
      setTransacciones(transaccionesData || []);

      // Cargar saldo de la billetera
      const { data: billeteraData, error: billeteraError } = await supabase
        .from(TABLES.BILLETERA)
        .select('saldo')
        .eq('usuario_id', user?.id)
        .single();

      if (billeteraError) throw billeteraError;
      setSaldo(billeteraData?.saldo || 0);

    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      setModalVisible(false);
      setTipoSeleccionado('ingreso');
      setCategoriaSeleccionada(null);
      setMonto('');
      setDescripcion('');
    });
  };

  const agregarTransaccion = async () => {
    if (!monto || !categoriaSeleccionada) {
      Alert.alert('Error', 'Por favor ingresa el monto y selecciona una categoría');
      return;
    }

    if (isNaN(Number(monto)) || Number(monto) <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    try {
      setLoading(true);

      const montoNumerico = Number(monto);
      const nuevoSaldo = tipoSeleccionado === 'ingreso' 
        ? saldo + montoNumerico 
        : saldo - montoNumerico;

      // Iniciar transacción
      const { error: transaccionError } = await supabase.rpc('crear_transaccion', {
        p_usuario_id: user?.id,
        p_categoria_id: categoriaSeleccionada.id,
        p_monto: montoNumerico,
        p_tipo: tipoSeleccionado,
        p_descripcion: descripcion || null
      });

      if (transaccionError) throw transaccionError;

      Alert.alert('Éxito', `${tipoSeleccionado === 'ingreso' ? 'Ingreso' : 'Gasto'} agregado correctamente`);
      handleCloseModal();
      cargarDatos(); // Recargar todos los datos
    } catch (error) {
      console.error('Error agregando transacción:', error);
      Alert.alert('Error', `No se pudo agregar el ${tipoSeleccionado === 'ingreso' ? 'ingreso' : 'gasto'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderTransaccion = ({ item }: { item: TransaccionConCategoria }) => {
    const categoriaExtendida = categorias.find(cat => cat.id === item.categoria_id);
    const esIngreso = item.tipo === 'ingreso';
    
    return (
      <View style={styles.transaccionItem}>
        <View style={[styles.transaccionIcono, { backgroundColor: (categoriaExtendida?.color || '#4CAF50') + '20' }]}>
          <MaterialIcons 
            name={categoriaExtendida?.icono || 'attach-money'}
            size={24} 
            color={categoriaExtendida?.color || (esIngreso ? '#4CAF50' : '#FF6B6B')} 
          />
        </View>
        <View style={styles.transaccionInfo}>
          <Text style={styles.transaccionCategoria}>
            {item.categorias.nombre}
          </Text>
          {item.descripcion && (
            <Text style={styles.transaccionDescripcion}>{item.descripcion}</Text>
          )}
          <Text style={styles.transaccionFecha}>
            {new Date(item.fecha).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[
          styles.transaccionMonto, 
          { color: esIngreso ? '#4CAF50' : '#FF6B6B' }
        ]}>
          {esIngreso ? '+' : '-'}${item.monto.toFixed(2)}
        </Text>
      </View>
    );
  };

  const modalScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  const modalTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });

  const categoriasFiltradas = categorias.filter(cat => cat.tipo === tipoSeleccionado);
  console.log('Tipo seleccionado:', tipoSeleccionado);
  console.log('Categorías filtradas:', categoriasFiltradas);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>¡Bienvenido!</Text>
        <Text style={styles.nameText}>{user?.nombre} {user?.apellido}</Text>
        <View style={styles.saldoContainer}>
          <Text style={styles.saldoLabel}>Saldo actual:</Text>
          <Text style={[styles.saldoMonto, { color: saldo >= 0 ? '#4CAF50' : '#FF6B6B' }]}>
            ${saldo.toFixed(2)}
          </Text>
        </View>
      </View>

      {loadingDatos ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={transacciones}
          renderItem={renderTransaccion}
          keyExtractor={item => item.id.toString()}
          style={styles.lista}
          contentContainerStyle={styles.listaContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="account-balance-wallet" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No hay transacciones registradas</Text>
              <Text style={styles.emptySubtext}>Toca el botón + para agregar una</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenModal}
      >
        <MaterialIcons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: modalScale },
                  { translateY: modalTranslateY }
                ]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Transacción</Text>
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.tipoSelector}>
              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipoSeleccionado === 'ingreso' && styles.tipoButtonSelected,
                  { borderColor: '#4CAF50' }
                ]}
                onPress={() => {
                  setTipoSeleccionado('ingreso');
                  setCategoriaSeleccionada(null);
                }}
              >
                <MaterialIcons 
                  name="add-circle-outline" 
                  size={24} 
                  color={tipoSeleccionado === 'ingreso' ? '#4CAF50' : '#666'} 
                />
                <Text style={[
                  styles.tipoButtonText,
                  tipoSeleccionado === 'ingreso' && { color: '#4CAF50' }
                ]}>
                  Ingreso
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipoSeleccionado === 'egreso' && styles.tipoButtonSelected,
                  { borderColor: '#FF6B6B' }
                ]}
                onPress={() => {
                  setTipoSeleccionado('egreso');
                  setCategoriaSeleccionada(null);
                }}
              >
                <MaterialIcons 
                  name="remove-circle-outline" 
                  size={24} 
                  color={tipoSeleccionado === 'egreso' ? '#FF6B6B' : '#666'} 
                />
                <Text style={[
                  styles.tipoButtonText,
                  tipoSeleccionado === 'egreso' && { color: '#FF6B6B' }
                ]}>
                  Gasto
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Monto"
              value={monto}
              onChangeText={setMonto}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <Text style={styles.sectionTitle}>Categoría</Text>
            {categoriasFiltradas.length === 0 ? (
              <View style={styles.emptyCategorias}>
                <MaterialIcons name="category" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No hay categorías disponibles</Text>
              </View>
            ) : (
              <FlatList
                data={categoriasFiltradas}
                horizontal={false}
                numColumns={2}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      categoriaSeleccionada?.id === item.id && { backgroundColor: item.color + '20' }
                    ]}
                    onPress={() => setCategoriaSeleccionada(item)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                      <MaterialIcons name={item.icono} size={24} color={item.color} />
                    </View>
                    <Text style={styles.categoryLabel}>{item.nombre}</Text>
                    <Text style={styles.categoryDescription} numberOfLines={1}>
                      {item.descripcion}
                    </Text>
                    {categoriaSeleccionada?.id === item.id && (
                      <View style={[styles.checkmark, { backgroundColor: item.color }]}>
                        <MaterialIcons name="check" size={16} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            <TextInput
              style={[styles.input, styles.inputDescripcion]}
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                (!monto || !categoriaSeleccionada) && styles.addButtonDisabled,
                { backgroundColor: tipoSeleccionado === 'ingreso' ? '#4CAF50' : '#FF6B6B' }
              ]}
              onPress={agregarTransaccion}
              disabled={loading || !monto || !categoriaSeleccionada}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.addButtonText}>
                  Agregar {tipoSeleccionado === 'ingreso' ? 'Ingreso' : 'Gasto'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nameText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  saldoContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saldoLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  saldoMonto: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    padding: 16,
  },
  transaccionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  transaccionIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transaccionInfo: {
    flex: 1,
  },
  transaccionCategoria: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transaccionDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transaccionFecha: {
    fontSize: 12,
    color: '#999',
  },
  transaccionMonto: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  tipoSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  tipoButtonSelected: {
    backgroundColor: '#FFF',
  },
  tipoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#333',
  },
  inputDescripcion: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoriesContainer: {
    maxHeight: 280,
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    position: 'relative',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CCC',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCategorias: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
});
