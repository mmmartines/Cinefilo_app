import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { useLoginForm } from '../hooks/useLoginForm';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { height } = Dimensions.get('window');

// Paleta fixa escura "Cinematográfica"
const darkTheme = {
  background: '#09090b', // Zinc 950
  card: 'rgba(24, 24, 27, 0.7)', // Zinc 900 translúcido
  border: 'rgba(255,255,255,0.1)',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA', // Zinc 400
  primary: '#E50914', // Netflix Red
  inputBackground: 'rgba(255,255,255,0.05)',
};

export function LoginScreen() {
  const router = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin,
    handleSocialLogin,
    handleResetPassword,
  } = useLoginForm();

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#09090b', '#180000', '#2b0000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Cinelândia 🍿</Text>
          <Text style={styles.slogan}>Muito além dos créditos.</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={styles.glassCard}>
          <Text style={styles.cardTitle}>Faça login para continuar</Text>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" color={darkTheme.textSecondary} size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor={darkTheme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" color={darkTheme.textSecondary} size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={darkTheme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.forgotPasswordWrap} onPress={handleResetPassword}>
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <AnimatedButton 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </AnimatedButton>

            <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerWrap}>
              <Text style={styles.registerText}>
                Não tem uma conta? <Text style={styles.registerLink}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou entre com</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={[styles.socialButton, { opacity: isLoading ? 0.7 : 1 }]} disabled={isLoading} onPress={() => handleSocialLogin('google')}>
              {isLoading ? <ActivityIndicator color="#000" /> : <FontAwesome5 name="google" color="#DB4437" size={20} />}
              <Text style={styles.socialButtonText}>{isLoading ? 'Entrando...' : 'Continuar com Google'}</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Desenvolvido por Martines Solutions</Text>
          <Text style={styles.footerText}>© 2026 Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 80,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: darkTheme.primary, 
    marginBottom: 8,
    textShadowColor: 'rgba(229, 9, 20, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  slogan: {
    fontSize: 18,
    color: darkTheme.textSecondary,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  glassCard: {
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.card,
  },
  cardTitle: {
    fontSize: 20,
    color: darkTheme.text,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.inputBackground,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: { flex: 1, color: darkTheme.text, fontSize: 16 },
  forgotPasswordWrap: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotPasswordText: { color: darkTheme.textSecondary, fontSize: 14 },
  loginButton: { backgroundColor: darkTheme.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: darkTheme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerWrap: {
    paddingVertical: 8,
  },
  registerText: {
    color: darkTheme.textSecondary,
    textAlign: 'center',
    fontSize: 15,
  },
  registerLink: {
    color: darkTheme.text,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: darkTheme.border,
  },
  dividerText: {
    color: darkTheme.textSecondary,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  socialContainer: {
    width: '100%',
  },
  socialButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0', 
  },
  socialButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footerContainer: {
    marginTop: 32,
    alignItems: 'center',
    opacity: 0.5,
  },
  footerText: {
    color: darkTheme.text,
    fontSize: 12,
    marginTop: 4,
  },
});
