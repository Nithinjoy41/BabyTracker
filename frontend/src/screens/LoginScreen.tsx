import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const eError = validateEmail(email);
    const pError = validatePassword(password);
    
    setEmailError(eError);
    setPasswordError(pError);
    
    if (eError || pError) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>🍼 BabyTracker</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <TextInput style={[styles.input, emailError ? styles.inputError : null]} placeholder="Email" value={email} onChangeText={(t) => { setEmail(t); setEmailError(null); }}
          autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#999" />
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}
        
        <TextInput style={[styles.input, passwordError ? styles.inputError : null]} placeholder="Password" value={password} onChangeText={(t) => { setPassword(t); setPasswordError(null); }}
          secureTextEntry placeholderTextColor="#999" />
        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5FF', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, elevation: 4, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#6C63FF', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#F5F5FF', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0DFFF' },
  inputError: { borderColor: '#FF6B6B' },
  errorText: { color: '#FF6B6B', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4, fontWeight: '600' },
  button: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14 },
  linkBold: { color: '#6C63FF', fontWeight: '600' },
});
