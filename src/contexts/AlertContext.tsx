import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from './ThemeContext';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

interface AlertContextData {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], icon?: string) => void;
  showToast: (message: string, icon?: string, color?: string) => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions & { icon?: string } | null>(null);

  // Toast States
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', icon: 'information-circle', color: '#fff' });
  const [toastAnim] = useState(new Animated.Value(0));

  const [fadeAnim] = useState(new Animated.Value(0));

  const showAlert = (title: string, message?: string, buttons?: AlertButton[], icon?: string) => {
    setOptions({
      title,
      message,
      buttons: buttons || [{ text: 'Fechar', onPress: () => closeAlert() }],
      icon,
    });
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeAlert = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setOptions(null);
    });
  };

  const showToast = (message: string, icon = 'trophy', color = '#FFD700') => {
    setToastConfig({ message, icon, color });
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.onPress) {
      btn.onPress();
    }
    closeAlert();
  };

  const getIconName = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('sucesso') || t.includes('sucesso!')) return 'checkmark-circle';
    if (t.includes('erro') || t.includes('ops')) return 'alert-circle';
    if (t.includes('aviso')) return 'warning';
    return 'information-circle';
  };

  const getIconColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('sucesso') || t.includes('sucesso!')) return '#4CAF50';
    if (t.includes('erro') || t.includes('ops') || t.includes('excluir') || t.includes('remover')) return '#F44336';
    if (t.includes('aviso')) return '#FF9800';
    return '#2196F3';
  };

  return (
    <AlertContext.Provider value={{ showAlert, showToast }}>
      {children}
      
      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[
          styles.toastContainer, 
          { 
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }]
          }
        ]}>
          <Ionicons name={toastConfig.icon as any} size={24} color={toastConfig.color} />
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </Animated.View>
      )}

      <Modal visible={visible} transparent={true} animationType="none">
        <View style={styles.overlay}>
          <Animated.View style={[styles.modalBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            {options && (
              <>
                <Ionicons 
                  name={options.icon || getIconName(options.title) as any} 
                  size={48} 
                  color={options.icon ? '#FFD700' : getIconColor(options.title)} 
                  style={{ marginBottom: 16 }}
                />
                
                <Text style={[styles.title, { color: colors.text }]}>{options.title}</Text>
                
                {options.message && (
                  <Text style={[styles.message, { color: colors.textSecondary }]}>{options.message}</Text>
                )}
                
                <View style={styles.buttonRow}>
                  {options.buttons?.map((btn, index) => {
                    const isDestructive = btn.style === 'destructive';
                    const isCancel = btn.style === 'cancel';
                    return (
                      <TouchableOpacity 
                        key={index}
                        style={[
                          styles.button, 
                          isDestructive && styles.buttonDestructive,
                          isCancel && styles.buttonCancel,
                          options.buttons!.length > 1 && { flex: 1 }
                        ]}
                        onPress={() => handleButtonPress(btn)}
                      >
                        <Text style={[
                          styles.buttonText,
                          isCancel && styles.buttonTextCancel
                        ]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 12,
  },
  toastText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  buttonCancel: {
    backgroundColor: '#333',
  },
  buttonDestructive: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    borderColor: '#E50914',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextCancel: {
    color: '#ccc',
  },
});
