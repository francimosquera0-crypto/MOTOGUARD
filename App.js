import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import * as SMS from 'expo-sms';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const EMERGENCY_NUMBER = '3001234567'; // Número de emergencia por defecto

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const startWatching = () => {
    setIsWatching(true);
    // Sensibilidad del acelerómetro para detectar movimiento brusco (robo)
    Accelerometer.setUpdateInterval(1000);
    const sub = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const totalForce = Math.sqrt(x*x + y*y + z*z);
      
      if (totalForce > 2.5) { // Umbral de movimiento detectado
        handleTheftAttempt();
      }
    });
    setSubscription(sub);
  };

  const stopWatching = () => {
    setIsWatching(false);
    if (subscription) {
      subscription.remove();
    }
    setSubscription(null);
  };

  const handleTheftAttempt = async () => {
    Alert.alert("¡ALERTA!", "Se detectó movimiento sospechoso en la moto.");
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync(
        [EMERGENCY_NUMBER],
        `¡ALERTA MOTOGUARD! Tu moto se está moviendo. Ubicación: https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`
      );
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Mi Moto"
            description="Ubicación actual"
          />
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>Cargando ubicación...</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <Text style={styles.title}>MOTOGUARD 🛡️</Text>
        <Text style={styles.status}>
          Estado: {isWatching ? 'VIGILANDO 🔒' : 'DESACTIVADO 🔓'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, isWatching ? styles.buttonStop : styles.buttonStart]} 
          onPress={isWatching ? stopWatching : startWatching}
        >
          <Text style={styles.buttonText}>
            {isWatching ? 'DESACTIVAR ALARMA' : 'ACTIVAR VIGILANCIA'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: '#2ecc71',
  },
  buttonStop: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  }
});
