import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [usuario, setUsuario] = useState('');
  const [gmail, setGmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!nombre || !apellido || !usuario || !gmail || !contrasena || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (contrasena !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (contrasena.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await signUp(nombre, apellido, usuario, gmail, contrasena);
      setRegistroExitoso(true);
    } catch (error: any) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={gmail}
        onChangeText={setGmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Registrarse</Text>
        )}
      </TouchableOpacity>

      {registroExitoso && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>Usuario registrado con éxito</Text>
          <TouchableOpacity 
            style={styles.loginRedirect}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.loginRedirectText}>¿Deseas iniciar sesión?</Text>
          </TouchableOpacity>
        </View>
      )}

      {!registroExitoso && (
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
          disabled={loading}
        >
          <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 15,
    padding: 10,
  },
  loginText: {
    color: '#007AFF',
    textAlign: 'center',
  },
  successContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loginRedirect: {
    padding: 10,
  },
  loginRedirectText: {
    color: '#007AFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
