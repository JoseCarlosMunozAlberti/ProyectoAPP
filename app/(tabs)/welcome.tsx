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
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, TABLES } from '../../supabase';
import type { Transaccion, Categoria } from '../../supabase';
import { useRouter } from 'expo-router';

type MaterialIconName = 'attach-money' | 'work' | 'business' | 'card-giftcard' | 'account-balance' | 'savings' | 'more-horiz' | 'add' | 'restaurant' | 'directions-car' | 'movie' | 'build' | 'shopping-cart' | 'person' | 'logout';

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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
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
  const [menuAnimation] = useState(new Animated.Value(0));
  const [datosIngresos, setDatosIngresos] = useState<{ categoria: string; monto: number; color: string }[]>([]);
  const [datosEgresos, setDatosEgresos] = useState<{ categoria: string; monto: number; color: string }[]>([]);
  const [montoError, setMontoError] = useState<string | null>(null);

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

  const procesarTransacciones = () => {
    const ingresosPorCategoria: { [key: string]: number } = {};
    const egresosPorCategoria: { [key: string]: number } = {};

    transacciones.forEach(transaccion => {
      const categoria = transaccion.categorias.nombre;
      const monto = transaccion.monto;

      if (transaccion.tipo === 'ingreso') {
        ingresosPorCategoria[categoria] = (ingresosPorCategoria[categoria] || 0) + monto;
      } else {
        egresosPorCategoria[categoria] = (egresosPorCategoria[categoria] || 0) + monto;
      }
    });

    const coloresIngresos = ['#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'];
    const coloresEgresos = ['#FF6B6B', '#FF8A8A', '#FFA9A9', '#FFC8C8', '#FFE7E7'];

    const datosIngresos = Object.entries(ingresosPorCategoria).map(([categoria, monto], index) => ({
      categoria,
      monto,
      color: coloresIngresos[index % coloresIngresos.length],
    }));

    const datosEgresos = Object.entries(egresosPorCategoria).map(([categoria, monto], index) => ({
      categoria,
      monto,
      color: coloresEgresos[index % coloresEgresos.length],
    }));

    setDatosIngresos(datosIngresos);
    setDatosEgresos(datosEgresos);
  };

  useEffect(() => {
    procesarTransacciones();
  }, [transacciones]);

  const renderGraficoExponencial = (datos: { categoria: string; monto: number; color: string }[], total: number) => {
    const alturaGrafico = 200;
    const anchoGrafico = Dimensions.get('window').width - 64; // Ancho de pantalla menos padding
    const padding = 20;
    const alturaUtil = alturaGrafico - (2 * padding);
    const anchoUtil = anchoGrafico - (2 * padding);

    // Ordenar datos de menor a mayor para efecto exponencial
    const datosOrdenados = [...datos].sort((a, b) => a.monto - b.monto);
    const maxMonto = Math.max(...datosOrdenados.map(d => d.monto));

    // Función para calcular la posición Y exponencial
    const calcularPosicionY = (monto: number) => {
      const factor = Math.log(monto + 1) / Math.log(maxMonto + 1); // +1 para evitar log(0)
      return alturaGrafico - (factor * alturaUtil) - padding;
    };

    return (
      <View style={styles.graficoWrapper}>
        <View style={[styles.graficoExponencial, { width: anchoGrafico, height: alturaGrafico }]}>
          {/* Eje Y */}
          <View style={[styles.ejeY, { height: alturaGrafico }]} />
          
          {/* Eje X */}
          <View style={[styles.ejeX, { width: anchoGrafico, bottom: padding }]} />

          {/* Líneas de datos */}
          {datosOrdenados.map((item, index) => {
            const x = (index + 1) * (anchoUtil / (datosOrdenados.length + 1)) + padding;
            const y = calcularPosicionY(item.monto);

            return (
              <React.Fragment key={index}>
                {/* Línea vertical desde eje X hasta el punto */}
                <View
                  style={[
                    styles.lineaVertical,
                    {
                      height: alturaGrafico - y - padding,
                      left: x,
                      bottom: padding,
                      backgroundColor: item.color,
                    },
                  ]}
                />
                
                {/* Punto de datos */}
                <View
                  style={[
                    styles.puntoDatos,
                    {
                      left: x - 6,
                      top: y - 6,
                      backgroundColor: item.color,
                    },
                  ]}
                />

                {/* Etiqueta de categoría */}
                <Text
                  style={[
                    styles.etiquetaCategoria,
                    {
                      left: x - 40,
                      bottom: 0,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.categoria}
                </Text>
              </React.Fragment>
            );
          })}
        </View>

        {/* Leyenda */}
        <View style={styles.leyendaGrafico}>
          {datosOrdenados.map((item, index) => (
            <View key={index} style={styles.itemLeyenda}>
              <View style={[styles.colorLeyenda, { backgroundColor: item.color }]} />
              <Text style={styles.textoLeyenda}>
                {item.categoria}: ${item.monto.toFixed(2)}
              </Text>
              <Text style={styles.porcentajeLeyenda}>
                ({((item.monto / total) * 100).toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
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

      // Verificar si hay suficiente saldo para el egreso
      if (tipoSeleccionado === 'egreso' && montoNumerico > saldo) {
        const diferencia = saldo - montoNumerico;
        setMontoError(`${diferencia.toFixed(2)} (Saldo insuficiente)`);
        setLoading(false);
        return;
      }

      setMontoError(null); // Limpiar error si existe

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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.spring(menuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    }
  };

  const categoriasFiltradas = categorias.filter(cat => cat.tipo === tipoSeleccionado);
  console.log('Tipo seleccionado:', tipoSeleccionado);
  console.log('Categorías filtradas:', categoriasFiltradas);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          <Text style={styles.nameText}>{user?.nombre} {user?.apellido}</Text>
        </View>
        <View style={styles.saldoContainer}>
          <Text style={styles.saldoLabel}>Saldo actual:</Text>
          <Text style={[styles.saldoMonto, { color: saldo >= 0 ? '#4CAF50' : '#FF6B6B' }]}>
            ${saldo.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.userButton}
          onPress={toggleMenu}
        >
          <MaterialIcons name="person" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [
                  { scale: menuAnimation },
                  {
                    translateY: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
                opacity: menuAnimation,
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="person" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.menuName}>{user?.nombre} {user?.apellido}</Text>
              <Text style={styles.menuEmail}>{user?.gmail}</Text>
            </View>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <MaterialIcons name="logout" size={24} color="#FFF" />
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content}>
        {loadingDatos ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : (
          <View style={styles.graficosContainer}>
            <View style={styles.graficoSeccion}>
              <Text style={styles.tituloGrafico}>Ingresos</Text>
              {datosIngresos.length > 0 ? (
                renderGraficoExponencial(
                  datosIngresos,
                  datosIngresos.reduce((acc, curr) => acc + curr.monto, 0)
                )
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialIcons name="show-chart" size={48} color="#CCC" />
                  <Text style={styles.noDataText}>No hay datos de ingresos</Text>
                </View>
              )}
            </View>

            <View style={styles.graficoSeccion}>
              <Text style={styles.tituloGrafico}>Egresos</Text>
              {datosEgresos.length > 0 ? (
                renderGraficoExponencial(
                  datosEgresos,
                  datosEgresos.reduce((acc, curr) => acc + curr.monto, 0)
                )
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialIcons name="show-chart" size={48} color="#CCC" />
                  <Text style={styles.noDataText}>No hay datos de egresos</Text>
                </View>
              )}
            </View>
          </View>
        )}

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
      </ScrollView>

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
                  { scale: animation },
                  { translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                  },
                ],
              },
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
              onChangeText={(text) => {
                setMonto(text);
                setMontoError(null); // Limpiar error al cambiar el monto
              }}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            {montoError && (
              <Text style={styles.errorText}>${montoError}</Text>
            )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  nameText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  userButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  menuOverlay: {
    position: 'absolute',
    top: 60, 
    right: 16,
    left: 16,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  menuEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signOutButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
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
  graficosContainer: {
    paddingVertical: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  graficoSeccion: {
    marginBottom: 24,
  },
  tituloGrafico: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  graficoWrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  graficoExponencial: {
    position: 'relative',
    marginBottom: 24,
    backgroundColor: '#FFF',
  },
  ejeX: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  ejeY: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#E0E0E0',
    left: 20,
  },
  lineaVertical: {
    position: 'absolute',
    width: 2,
    opacity: 0.7,
  },
  puntoDatos: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  etiquetaCategoria: {
    position: 'absolute',
    width: 80,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    transform: [{ rotate: '-45deg' }],
  },
  leyendaGrafico: {
    width: '100%',
  },
  itemLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  colorLeyenda: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  textoLeyenda: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  porcentajeLeyenda: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});
