import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getAuth,
  updateEmail,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { db } from "../firebaseconfig";
import {
  doc,
  getDoc,
  updateDoc,
  DocumentSnapshot,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Dimensions } from 'react-native';

const statusBarHeight = Constants.statusBarHeight;

const defaultImage = require("../../assets/images/profilePics/1.png");

const { width } = Dimensions.get("window");
const adjustedSize = width > 385 ? 160 : 140;

const preDefinedImages = [
  require("../../assets/images/profilePics/1.png"),
  require("../../assets/images/profilePics/2.png"),
  require("../../assets/images/profilePics/3.png"),
  require("../../assets/images/profilePics/4.png"),
  require("../../assets/images/profilePics/5.png"),
  require("../../assets/images/profilePics/6.png"),
];

interface UserData {
  name: string;
  email: string;
  registeredAcademy?: string;
}

const UserProfileScreen = () => {
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [registeredAcademy, setRegisteredAcademy] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const auth = getAuth();
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            setUserName(userData.name || "Nome não disponível");
            setUserEmail(userData.email || "E-mail não disponível");

            const profileImageUrl = userData.profileImage;

            if (profileImageUrl) {
              setProfileImage(profileImageUrl);
            } else {
              setProfileImage("https://via.placeholder.com/100");
            }

            const academyEmail = userData.registeredAcademy;

            if (academyEmail) {
              const academyDocRef = query(
                collection(db, "academias"),
                where("ownerEmail", "==", academyEmail)
              );
              const querySnapshot = await getDocs(academyDocRef);

              if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                  const academyData = doc.data();
                  setRegisteredAcademy(
                    academyData?.name || "Academia não registrada"
                  );
                });
              } else {
                setRegisteredAcademy("Academia não encontrada");
              }
            } else {
              setRegisteredAcademy("Academia não registrada");
            }
          } else {
            console.log("Nenhum dado encontrado para este usuário");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [auth, router]);

  const handleImageSelect = async (image: any) => {
    if (!user) {
      Alert.alert(
        "Erro",
        "Usuário não autenticado. Por favor, faça login novamente."
      );
      return;
    }

    try {
      // Verifica o tipo da imagem (recurso local ou URL)
      const imageUrl =
        typeof image === "number" ? Image.resolveAssetSource(image).uri : image;

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { profileImage: imageUrl });

      setProfileImage(image); // Mantém a referência correta (local ou URL)
      Alert.alert("Sucesso", "Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar a foto de perfil:", error);
      Alert.alert("Erro", "Não foi possível atualizar a foto de perfil.");
    } finally {
      setImageModalVisible(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!user) {
      Alert.alert(
        "Erro",
        "Usuário não autenticado. Por favor, faça login novamente."
      );
      return;
    }

    try {
      if (newName !== "") {
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, { name: newName });
        setUserName(newName);
        Alert.alert("Sucesso", "Nome atualizado com sucesso!");
      }

      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
        setUserEmail(newEmail);
        Alert.alert(
          "Sucesso",
          "E-mail atualizado com sucesso! Faça login novamente."
        );
        await signOut(auth);
        return;
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      Alert.alert("Erro", "Houve um erro ao atualizar seus dados.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Houve um erro ao tentar fazer logout.");
    }
  };

  if (loading) {
    return (
      <View>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={[styles.notificationIcon, { paddingTop: statusBarHeight }]}
        >
          <MaterialIcons name="notifications-none" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <Image
            source={
              typeof profileImage === "number"
                ? profileImage
                : profileImage
                ? { uri: profileImage }
                : defaultImage
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <Text style={styles.subtitle}>//Clique na foto para alterá-la</Text>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
        <Text style={styles.role}>{registeredAcademy}</Text>
      </View>
      <View style={{ padding: 10 }}>
        <View style={styles.settingsContainer}>
          {[{ title: "Dados Pessoais", icon: "person" }].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingRow}
              onPress={() => {
                if (item.title === "Dados Pessoais") {
                  setNewName(userName);
                  setNewEmail(userEmail);
                  setModalVisible(true);
                }
              }}
            >
              <MaterialIcons name={item.icon} size={24} color="#fff" />
              <Text style={styles.settingText}>{item.title}</Text>
              <MaterialIcons name="chevron-right" size={24} color="#00b388" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.settingsContainer}>
          {[{ title: "Reportar Erro", icon: "bug-report" }].map(
            (item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.settingRow}
                onPress={() => {
                  router.push("../reportError");
                }}
              >
                <MaterialIcons name={item.icon} size={24} color="#fff" />
                <Text style={styles.settingText}>{item.title}</Text>
                <MaterialIcons name="chevron-right" size={24} color="#00b388" />
              </TouchableOpacity>
            )
          )}
        </View>
        <View style={{ paddingBottom: 70 }}>
          {/* Ajustando o estilo do botão "Sair" */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="exit-to-app" size={24} color="#fff" />
            <Text style={styles.settingText1}>Sair</Text>
            <MaterialIcons name="chevron-right" size={24} color="#00b388" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Informações</Text>

            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Novo Nome"
              placeholderTextColor="#888"
              editable={false} 
            />

            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Novo E-mail"
              placeholderTextColor="#888"
              editable={false} 
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleConfirmSave}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para escolha de foto de perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Escolha uma Foto</Text>

            <ScrollView horizontal>
              {preDefinedImages.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleImageSelect(image)}
                >
                  <Image
                    source={typeof image === "string" ? { uri: image } : image}
                    style={{
                      width: 100,
                      height: 100,
                      margin: 5,
                      borderRadius: 100,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "rgb(7, 7, 7)",
  },
  header: {
    alignItems: "center",
    padding: 30,
    paddingTop: 100,
    backgroundColor: "#101010",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: "relative",
  },
  notificationIcon: {
    position: "absolute",
    top: 30,
    right: 10,
  },
  profileImage: {
    width: adjustedSize,
    height: adjustedSize,
    borderRadius: 100,
    marginVertical: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 10,
    color: "#808080",
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: "#eee",
    marginBottom: 10,
  },
  role: {
    fontSize: 20,
    color: "#00b388",
    marginBottom: 10,
    fontWeight: "bold"
  },
  settingsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 20,
    borderWidth: 1,
    backgroundColor: "#101010",
    borderColor: "#252525",
    marginTop: 20,
    borderRadius: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingText: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
  },

  settingText1: {
    flex: 1,
    color: "#fff",
    marginLeft: -8,
  },

  logoutButton: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 30,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#101010",
    borderColor: "#252525",
    borderWidth: 1,
    gap: 20,
  },

  saveButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#00bb83",
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#101010",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: "#252525",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#252525",
    color: "#fff",
    borderRadius: 5,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});

export default UserProfileScreen;
