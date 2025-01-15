import React, { useState, useEffect } from "react";
import {
  View,
  KeyboardAvoidingView,
  Image,
  Dimensions,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";

const statusBarHeight = Constants.statusBarHeight;
const { width } = Dimensions.get("window");


type Task = {
  id: number;
  text: string;
  checked?: boolean;
};

type FormData = {
  name: string;
  weight: string;
  height: string;
  age: string;
  gender: string;
  objective: string;
  level: string;
};

export default function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]); // Define o tipo de tasks aqui
  const [nome, setNome] = useState<string>("");
  const [checkedCards, setCheckedCards] = useState<number[]>([]);
  const [greeting, setGreeting] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    weight: "",
    height: "",
    age: "",
    gender: "",
    objective: "",
    level: "",
  });
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  // Função para abrir o modal
  const openModal = () => setModalVisible(true);

  // Função para fechar o modal
  const closeModal = () => setModalVisible(false);

  // Função de refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // Função para alternar a seleção das tarefas
  const toggleCheck = (cardId: number) => {
    if (checkedCards.includes(cardId)) {
      setCheckedCards(checkedCards.filter((id) => id !== cardId));
    } else {
      setCheckedCards([...checkedCards, cardId]);
    }
  };

  // Efeito para definir o horário de saudação
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 12) {
      setGreeting("Bom Dia");
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting("Boa Tarde");
    } else {
      setGreeting("Boa Noite");
    }

    if (user) {
      const docRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setNome(docSnap.data().name || "Usuário");
            console.log("Usuário autenticado:", user.email);
          } else {
            console.log("Nenhum documento encontrado!");
          }
        },
        (error) => {
          console.error("Erro ao ouvir mudanças no documento:", error);
        }
      );

      return () => unsubscribe();
    }
  }, []);

  // Função de alteração de dados do formulário
  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Função de envio de dados do formulário
  const handleSubmit = () => {
    if (
      !formData.weight ||
      !formData.height ||
      !formData.age ||
      !formData.objective
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const serverUrl = "https://backend-fitfusion.onrender.com/create";

    fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao gerar dieta.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Dados recebidos:", data);
        return AsyncStorage.setItem("nutritionData", JSON.stringify(data)).then(
          () => {
            setFormData(data);
            router.push("/dietas");
          }
        );
      })
      .catch((error) => {
        console.error("Erro ao enviar dados:", error);
        Alert.alert("Erro", "Não foi possível gerar a dieta. Tente novamente.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Função para adicionar tarefas
  const saveTasksToStorage = async (tasks) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error);
    }
  };

  // Função para adicionar uma nova tarefa
  const addTask = () => {
    if (!newTask.trim()) {
      Alert.alert("Erro", "Por favor, insira uma tarefa válida.");
      return;
    }

    const updatedTasks = [...tasks, { id: Date.now(), text: newTask }];

    setTasks(updatedTasks);
    saveTasksToStorage(updatedTasks); // Salva as tarefas localmente
    setNewTask("");
    closeModal();
  };

  // Função para carregar tarefas ao iniciar o app
  const loadTasksFromStorage = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  // Use o loadTasksFromStorage dentro de useEffect para carregar as tarefas ao iniciar o app
  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId); // Filtra a tarefa pelo ID
    setTasks(updatedTasks); // Atualiza o estado
    saveTasksToStorage(updatedTasks); // Salva no armazenamento local
  };

  const toggleTaskCheck = async (taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, checked: !task.checked } : task
      )
    );
  
    try {
      // Salvar no AsyncStorage
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (e) {
      console.error("Error saving tasks", e);
    }
  };
  
  // Recuperar do AsyncStorage quando o app carregar
  useEffect(() => {
    const getTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem("tasks");
        if (savedTasks) {
          const loadedTasks = JSON.parse(savedTasks);
          setTasks(loadedTasks); // Atualiza o estado com os dados carregados
        }
      } catch (e) {
        console.error("Error loading tasks", e);
      }
    };
  
    getTasks();
  }, []);

  const removeChecksAfterMidnight = () => {
    const today = new Date().setHours(0, 0, 0, 0); // Data de hoje à meia-noite

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.checked && task.checkedDate) {
          const checkedDate = new Date(task.checkedDate).setHours(0, 0, 0, 0);
          if (checkedDate < today) {
            return { ...task, checked: false, checkedDate: null };
          }
        }
        return task;
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      removeChecksAfterMidnight();
    }, 60 * 60 * 1000); // Verifica a cada 1 hora

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [tasks]);

  // Também chama a função ao carregar o app
  useEffect(() => {
    removeChecksAfterMidnight();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[{ backgroundColor: "#070707" }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={[styles.notificationIcon, { paddingTop: statusBarHeight }]}
        >
          <MaterialIcons name="notifications-none" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginTop: -28 }}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{nome}</Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>Acesso Rápido </Text>

        <View style={{ flexDirection: "row", gap: 7 }}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/treinos")}
          >
            <Text style={styles.cardText}>Treinos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/artigos")}
          >
            <Text style={styles.cardText}>Artigos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/dietas")}
          >
            <Text style={styles.cardText}>Dietas</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}></View>

      <View style={styles.checkableCardsContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <Text style={styles.sectionTitle}>Rotina</Text>
          <TouchableOpacity
            onPress={openModal} // Chama a função para abrir o modal
            style={styles.addTaskButton}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 0 }}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.checkableCard, task.checked && styles.checkedCard]}
              onPress={() => toggleTaskCheck(task.id)}
            >
              <Text style={styles.cardText}>{task.text}</Text>

              {/* Container para os ícones */}
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name={
                    task.checked ? "check-circle" : "radio-button-unchecked"
                  }
                  size={24}
                  color={task.checked ? "#00BB83" : "#00BB83"}
                />
                <TouchableOpacity onPress={() => deleteTask(task.id)}>
                  <MaterialIcons name="delete" size={24} color="#FF4C4C" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Modal para adicionar tarefa */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Botão de fechar com ícone "X" */}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Adicionar Nova Tarefa</Text>
              <TextInput
                style={styles.inputs}
                placeholder="Digite a tarefa"
                value={newTask}
                onChangeText={setNewTask}
                placeholderTextColor={"#fff"}
              />
              <TouchableOpacity style={styles.formButton} onPress={addTask}>
                <Text style={styles.formButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <View style={{ paddingTop: 40 }}></View>

      <View style={styles.waterRemember}>
        <View style={styles.waterCard}>
          <MaterialIcons name="local-drink" size={40} color="#00BB83" />
          <Text style={styles.waterTitle}>Beba água!</Text>
          <Text style={styles.waterDesc}>
            Beba no mínimo 2 Litros de água no seu dia!
          </Text>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}></View>

      {/* dieta */}
      {/* dieta */}
      <View style={styles.dietCont}>
        <Text style={styles.sectionTitle}>
          <Text style={{ color: "#00BB83" }}>{nome}</Text>, crie sua dieta!
        </Text>
        <View style={styles.dietContainer}>
          <TextInput
            style={styles.input}
            placeholderTextColor={"#fff"}
            placeholder="Peso"
            value={formData.weight}
            onChangeText={(text) => handleChange("weight", text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Altura"
            placeholderTextColor={"#fff"}
            value={formData.height}
            onChangeText={(text) => handleChange("height", text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Idade"
            placeholderTextColor={"#fff"}
            value={formData.age}
            onChangeText={(text) => handleChange("age", text)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholderTextColor={"#fff"}
            placeholder="Gênero"
            value={formData.gender}
            onChangeText={(text) => handleChange("gender", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Objetivo"
            value={formData.objective}
            onChangeText={(text) => handleChange("objective", text)}
            placeholderTextColor={"#fff"}
          />
          <TextInput
            style={styles.input}
            placeholder="Nível de Atividade"
            value={formData.level}
            placeholderTextColor={"#fff"}
            onChangeText={(text) => handleChange("level", text)}
          />

          <TouchableOpacity
            style={styles.formButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.formButtonText}>Criar Dieta</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 82,
    paddingBottom: 30,
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
  greeting: {
    fontSize: 16,
    color: "#00BB83",
    fontWeight: 200,
  },
  userName: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
  },
  span: {
    color: "#fff",
  },
  cardsContainer: {
    paddingHorizontal: 10,
    paddingTop: 20,
    gap: 15,
  },
  card: {
    backgroundColor: "#101010",
    borderColor: "#252525",
    borderWidth: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  dietCont: {
    paddingHorizontal: 10,
  },
  dietContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#101010",
    borderColor: "#252525",
    borderWidth: 1,
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    color: "#fff",
    width: "100%",
  },
  formButton: {
    backgroundColor: "#00BB83",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  formButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },

  waterRemember: {
    paddingHorizontal: 10,
  },

  waterCard: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#101010",
    borderColor: "#00BB83",
    borderWidth: 0.5,
    padding: 20,
    borderRadius: 20,
    marginBottom: 10,
    gap: 5,
  },

  addTaskButton: {
    backgroundColor: "#00BB83",
    padding: 5,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  waterTitle: {
    color: "#fff",
    fontSize: 20,
  },
  waterDesc: {
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 23,
    color: "#fff",
  },

  checkableCardsContainer: {
    paddingHorizontal: 10,
  },
  checkableCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#101010",
    borderColor: "#252525",
    borderWidth: 1,
    padding: 20,
    borderRadius: 20,
    marginBottom: 10,
  },
  checkedCard: {
    backgroundColor: "#003f2a",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  deleteButton: {
    position: "absolute",
    marginLeft: "auto",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#101010",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    position: "relative", // Necessário para posicionar o botão de fechar
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 20,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    textAlign: "center",
  },

  inputs: {
    width: "100%",
    padding: 15,
    borderColor: "#252525",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#FF6347", // Cor do botão de cancelar (vermelho)
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
});
