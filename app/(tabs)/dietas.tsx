import React from "react";
import {
  View,
  KeyboardAvoidingView,
  Image,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity
} from "react-native";
import useCustomFonts from "../../assets/fonts/fonts"; 
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const imgbg = "../../assets/images/bgfundo2.png";
const imgbg1 = "../../assets/images/bgfundo2.png";
const bulk = "../../assets/images/bulking.jpg";
const cut = "../../assets/images/cutting.jpg";

export default function Treino() {
   /* fonte */
  const fontsLoaded = useCustomFonts();

  const router = useRouter();
  const goMusculacao = () => {
    router.push("../screens/musculacao");
  };
  
  const goAerobico = () => {
    router.push("../screens/aerobico");
  };

  return (
    <View style={styles.imgContainer}>
      <ImageBackground source={require(imgbg)} style={styles.imgBack}>
        <KeyboardAvoidingView style={styles.background}>
          <View style={styles.configContainer}>
            <View style={styles.headerText}>
              <Text style={styles.pagTitle}>Selecione o dieta ideal</Text>
              <Text style={styles.pagDescription}>
                Selecione a dieta de acordo com suas necessidades...
              </Text>
            </View>

            <View style={styles.contentPage}>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cardContainer}
                  onPress={() => goMusculacao()}
                >
                  <Image source={require(bulk)} style={styles.card} />
                  <Text style={styles.cardText}>Ganho de Peso (Bulking)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardContainer}
                  onPress={() => goAerobico()}
                >
                  <Image source={require(cut)} style={styles.card} />
                  <Text style={styles.cardText}>Perca de Peso (Cutting)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  imgContainer: {
    flex: 1,
  },
  imgBack: {
    width: "100%",
    height: "100%",
  },
  background: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  configContainer: {
    width: "100%",
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    padding: width >= 390 ? 20 : width >= 360 ? 15 : 13,
    paddingLeft: 20,
    width: "95%",
    marginBottom: 15,
  },
  pagTitle: {
    color: "#fff",
    paddingTop: 20,
    fontFamily: "ArchivoBlack",
    lineHeight: width >= 390 ? 55 : 40,
    marginBottom: width >= 800 ? 25 : width >= 550 ? 15 : width >= 480 ? 15 : width >= 360 ? 15 : 10,
    fontSize: width >= 800 ? 75 : width >= 550 ? 63 : width >= 480 ? 55 : width >= 475 ? 45 : width >= 360 ? 45 : 40,
  },
  pagDescription: {
    color: "#fff",
    fontSize: width >= 480 ? 20 : width >= 390 ? 15 : width >= 360 ? 12 : 12,
    marginBottom: width >= 390 ? 17 : width >= 360 ? 15 : 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: width >= 390 ? -35 : width >= 360 ? -30 : -40,
    width: "100%",
    paddingHorizontal: 10,
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    marginBottom: width >= 390 ? 100 : width >= 360 ? 95 : 85,
    aspectRatio: 1.15,
    borderRadius: 20,
  },
  card: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardText: {
    fontSize: width >= 390 ? 18 : width >= 360 ? 14 : 12,
    color: "white",
    marginTop: 15,
    textAlign: "center",
  },
});
