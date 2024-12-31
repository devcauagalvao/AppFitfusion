import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import Constants from "expo-constants";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseconfig";

interface Treino {
  name: string;
  exercises: string[];
}

const { width } = Dimensions.get("window");
const statusBarHeight = Constants.statusBarHeight;

export default function Treino() {
  const [emailUsuario, setEmailUsuario] = useState<string>("");
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [treinos, setTreinos] = useState<Treino[] | null>(null);
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);

  useEffect(() => {
    const auth = getAuth();

 
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmailUsuario(user.email || "");
        setIsUserLoggedIn(true);
        console.log("Você está logado", user.email);
      } else {
        setIsUserLoggedIn(false);
      }
    });
  }, []);

  useEffect(() => {
    if (isUserLoggedIn && emailUsuario) {
      const presetsRef = collection(db, "presets");
      const q = query(
        presetsRef,
        where("assignedUser", "array-contains", emailUsuario)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const treinosAtualizados: Treino[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.workouts) {
              treinosAtualizados.push(...(data.workouts as Treino[]));
            }
          });
          setTreinos(treinosAtualizados);
        } else {
          setTreinos(null);
        }
      });

      return () => unsubscribe();
    }
  }, [isUserLoggedIn, emailUsuario]);

  const handleSelectTreino = (treino: Treino) => {
    setSelectedTreino(treino);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: statusBarHeight }]}>
      <KeyboardAvoidingView style={styles.background}>
        <View style={styles.configContainer}>
          <View style={styles.headerText}>
            <Text style={styles.pagTitle}>Selecione o seu treino</Text>
            <Text style={styles.pagDescription}>
              Selecione o treino de acordo com sua disponibilidade...
            </Text>
          </View>

          {!isUserLoggedIn ? (
            <Text style={styles.noTreinoText}>
              Você precisa estar logado para acessar os treinos.
            </Text>
          ) : treinos ? (
            <View>
              <View style={styles.buttonContainer}>
                {treinos.map((treino, index) => (
                  <Pressable
                    key={index}
                    style={styles.selectButton}
                    onPress={() => handleSelectTreino(treino)}
                  >
                    <Text style={styles.buttonText}>{treino.name}</Text>
                  </Pressable>
                ))}
              </View>

              {selectedTreino ? (
                <View style={styles.treinoCard}>
                  <Text style={styles.treinoText}>{selectedTreino.name}</Text>
                  {selectedTreino.exercises.map((exercise, idx) => (
                    <View key={idx} style={styles.exerciseItem}>
                      <View style={styles.bulletPoint}></View>
                      <Text style={styles.exerciseText}>{exercise}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noTreinoText}>
                  Selecione um treino para ver os detalhes.
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noTreinoText}>
              Nenhum treino encontrado para o seu usuário.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(7, 7, 7)",  },
  background: {
    flex: 1,
  },
  configContainer: {
    width: "100%",
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: "flex-start",
    paddingTop: 30,
  },
  headerText: {
    marginBottom: 20,
  },
  pagTitle: {
    color: "#00BB83",
    fontWeight: "bold",
    fontSize: width >= 800 ? 75 : width >= 550 ? 63 : width >= 480 ? 55 : 45,    marginBottom: 10,
  },
  pagDescription: {
    color: "#A0A0A0",
    fontSize: width >= 480 ? 18 : width >= 390 ? 16 : 14,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 30,
  },
  selectButton: {
    backgroundColor: "linear-gradient(45deg, #00BB83, #00D4FF)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    margin: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  treinoCard: {
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#252525",
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  treinoText: {
    color: "#00BB83",
    fontWeight: "bold",
    fontSize: 22,
    marginBottom: 15,
    textAlign: "center",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00BB83",
    marginRight: 10,
  },
  exerciseText: {
    color: "#E0E0E0",
    fontSize: 16,
  },
  noTreinoText: {
    color: "#A0A0A0",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
});
