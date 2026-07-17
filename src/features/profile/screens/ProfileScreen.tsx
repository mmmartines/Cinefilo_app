import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Switch, ActivityIndicator,  } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useProfile } from '../hooks/useProfile';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import { useAlert } from '../../../contexts/AlertContext';

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { themeMode, setThemeMode, colors } = useAppTheme();
  const styles = getStyles(colors);

  const {
    userProfile,
    userName,
    setUserName,
    userBirthdate,
    userPassword,
    setUserPassword,
    isProfileLoading,
    isDeleteModalVisible,
    setIsDeleteModalVisible,
    deleteConfirmationText,
    setDeleteConfirmationText,
    userAvatarUrl,
    isNotificationsEnabled,
    birthdateDate,
    isDatePickerVisible,
    setIsDatePickerVisible,
    handleChangeDate,
    handlePickImage,
    handleToggleNotifications,
    handleSaveProfile,
    handleDeleteUserAccount,
    handleUserLogout,
    userProvider,
  } = useProfile();

  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={handleUserLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.tagSection}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={userProvider === 'google' ? undefined : handlePickImage} style={styles.avatarWrapper} activeOpacity={userProvider === 'google' ? 1 : 0.2}>
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            <View style={[styles.editAvatarBadge, userProvider === 'google' && { backgroundColor: colors.text }]}>
              {userProvider === 'google' ? (
                <Ionicons name="logo-google" size={14} color="#DB4437" />
              ) : (
                <Ionicons name="camera" size={14} color={colors.text} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tagBox}>
          <Text style={styles.tagLabel}>Sua #Tag de Amizade</Text>
          <TouchableOpacity 
            style={styles.tagRow} 
            activeOpacity={0.7}
            onPress={async () => {
              if (userProfile?.tag) {
                await Clipboard.setStringAsync(userProfile.tag);
                showAlert('Copiado!', 'Tag copiada para a área de transferência.');
              }
            }}
          >
            <Text style={styles.tagText}>{userProfile?.tag || 'GERANDO...'}</Text>
            <Ionicons name="copy-outline" size={20} color="#E50914" />
          </TouchableOpacity>
        </View>

      </View>

      <View style={styles.form}>
        <Text style={styles.label}>E-mail (Não pode ser alterado)</Text>
        <View style={[styles.inputContainer, styles.disabledInput]}>
          <Ionicons name="mail" color={colors.textSecondary} size={20} style={styles.icon} />
          <TextInput
            style={[styles.input, { color: colors.textSecondary }]}
            value={userProfile.email}
            editable={false}
          />
        </View>

        <Text style={styles.label}>Nome Completo</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person" color={colors.textSecondary} size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
          />
        </View>

        <Text style={styles.label}>Data de Nascimento</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="calendar" color={colors.textSecondary} size={20} style={styles.icon} />
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'center' }} 
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Text style={{ color: userBirthdate ? colors.text : colors.textSecondary, fontSize: 16 }}>
              {userBirthdate || "Data de Nascimento"}
            </Text>
          </TouchableOpacity>
        </View>

        {isDatePickerVisible && (
          <DateTimePicker
            value={birthdateDate}
            mode="date"
            display="default"
            onChange={handleChangeDate}
            maximumDate={new Date()}
          />
        )}

        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" color={colors.textSecondary} size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            value={userPassword}
            onChangeText={setUserPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveProfile}
          disabled={isProfileLoading}
        >
          <Text style={styles.saveButtonText}>
            {isProfileLoading ? 'Processando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>

        <View style={styles.settingsSection}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Tema do Aplicativo</Text>
              <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>Modo Claro/Escuro</Text>
            </View>
            <Picker
              selectedValue={themeMode}
              style={{ height: 50, width: 150, color: colors.text, backgroundColor: colors.backgroundSelected }}
              onValueChange={(itemValue) => setThemeMode(itemValue)}
            >
              <Picker.Item label="Sistema" value="system" />
              <Picker.Item label="Claro" value="light" />
              <Picker.Item label="Escuro" value="dark" />
            </Picker>
          </View>
          <Text style={styles.settingsTitle}>Configurações Adicionais</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Notificações Push</Text>
              <Text style={styles.settingSubLabel}>Avisar sobre novas mensagens no Clube</Text>
            </View>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: '#E50914' }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zona de Perigo</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => setIsDeleteModalVisible(true)}
            disabled={isProfileLoading}
          >
            <Ionicons name="trash-outline" size={20} color={colors.text} />
            <Text style={styles.deleteButtonText}>Deletar Minha Conta</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#E50914" />
            <Text style={styles.modalTitle}>Deletar Conta</Text>
            <Text style={styles.modalText}>
              Tem certeza absoluta? Esta ação não pode ser desfeita e todo o seu histórico será perdido.
            </Text>
            
            <Text style={styles.modalLabel}>Digite DELETAR para confirmar:</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setDeleteConfirmationText('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalDeleteBtn, deleteConfirmationText !== 'DELETAR' && styles.modalDeleteBtnDisabled]} 
                onPress={handleDeleteUserAccount}
                disabled={deleteConfirmationText !== 'DELETAR' || isProfileLoading}
              >
                <Text style={styles.modalDeleteText}>
                  {isProfileLoading ? 'Deletando...' : 'Sim, Deletar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.backgroundElement, marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#E50914' },
  backButton: { padding: 8 },
  logoutButton: { padding: 8 },
  tagSection: { paddingHorizontal: 24, marginBottom: 24 },
  tagBox: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#E50914', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  tagLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tagText: { color: '#E50914', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  form: { paddingHorizontal: 24 },
  label: { color: colors.textSecondary, marginBottom: 8, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundElement, borderRadius: 12, marginBottom: 20, paddingHorizontal: 16, height: 56 },
  disabledInput: { backgroundColor: colors.border, borderColor: colors.border, borderWidth: 1 },
  icon: { marginRight: 12 },
  input: { flex: 1, color: colors.text, fontSize: 16 },
  saveButton: { backgroundColor: '#E50914', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  settingsSection: { marginTop: 16, marginBottom: 16, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border },
  settingsTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { color: colors.text, fontSize: 16 },
  settingSubLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  dangerZone: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 40 },
  dangerTitle: { color: '#E50914', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  deleteButton: { flexDirection: 'row', backgroundColor: 'rgba(229, 9, 20, 0.2)', borderWidth: 1, borderColor: '#E50914', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 12 },
  deleteButtonText: { color: '#E50914', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.backgroundElement, borderRadius: 16, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: '#E50914', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  modalText: { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalLabel: { color: colors.text, alignSelf: 'flex-start', marginBottom: 8, fontWeight: 'bold' },
  modalInput: { backgroundColor: colors.border, borderWidth: 1, borderColor: colors.border, color: colors.text, width: '100%', height: 48, borderRadius: 8, paddingHorizontal: 16, marginBottom: 24, textAlign: 'center', fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 8, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: colors.text, fontWeight: 'bold' },
  modalDeleteBtn: { flex: 1, height: 48, borderRadius: 8, backgroundColor: '#E50914', justifyContent: 'center', alignItems: 'center' },
  modalDeleteBtnDisabled: { backgroundColor: colors.border },
  modalDeleteText: { color: '#fff', fontWeight: 'bold' },
});
