import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Pressable,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

type IconName = 'restaurant' | 'home' | 'directions-car' | 'shopping-bag' | 'local-mall' | 'school' | 'local-hospital' | 'attach-money';

const EXPENSE_CATEGORIES: Array<{
  id: string;
  icon: IconName;
  color: string;
  label: string;
  description: string;
}> = [
  { 
    id: 'food',
    icon: 'restaurant',
    color: '#FF6B6B',
    label: 'Comida',
    description: 'Restaurantes, mercado, delivery'
  },
  { 
    id: 'housing',
    icon: 'home',
    color: '#4ECDC4',
    label: 'Vivienda',
    description: 'Alquiler, servicios, mantenimiento'
  },
  { 
    id: 'transport',
    icon: 'directions-car',
    color: '#45B7D1',
    label: 'Transporte',
    description: 'Gasolina, pasajes, mantenimiento'
  },
  { 
    id: 'shopping',
    icon: 'local-mall',
    color: '#96CEB4',
    label: 'Compras',
    description: 'Ropa, tecnología, accesorios'
  },
  { 
    id: 'education',
    icon: 'school',
    color: '#D4A5A5',
    label: 'Educación',
    description: 'Cursos, libros, materiales'
  },
  { 
    id: 'health',
    icon: 'local-hospital',
    color: '#9B6B6C',
    label: 'Salud',
    description: 'Medicinas, consultas, seguros'
  },
  { 
    id: 'others',
    icon: 'attach-money',
    color: '#6B717E',
    label: 'Otros',
    description: 'Gastos varios'
  }
];

export default function ExpensesScreen() {
  const { transactions, addTransaction, deleteTransaction } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [animation] = useState(new Animated.Value(0));
  
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
    });
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleAddExpense = () => {
    if (!amount || !selectedCategory) {
      return;
    }

    addTransaction({
      type: 'expense',
      amount: parseFloat(amount),
      category: selectedCategory,
      description,
      date: new Date()
    });

    setAmount('');
    setSelectedCategory('');
    setDescription('');
    handleCloseModal();
  };

  const modalScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });

  const modalTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });

  return (
    <View style={styles.container}>
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
              <Text style={styles.modalTitle}>Nuevo Gasto</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Monto"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <Text style={styles.sectionTitle}>Categoría</Text>
            <ScrollView 
              style={styles.categoriesContainer}
              showsVerticalScrollIndicator={false}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && { backgroundColor: category.color + '20' }
                  ]}
                  onPress={() => handleSelectCategory(category.id)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                    <MaterialIcons name={category.icon} size={24} color={category.color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                  {selectedCategory === category.id && (
                    <MaterialIcons name="check-circle" size={24} color={category.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                (!amount || !selectedCategory) && styles.addButtonDisabled
              ]}
              onPress={handleAddExpense}
              disabled={!amount || !selectedCategory}
            >
              <Text style={styles.addButtonText}>Agregar Gasto</Text>
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1,
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
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
