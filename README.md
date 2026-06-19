# CacaoScan - Módulo de Autenticación (Frontend)

Este repositorio contiene la aplicación móvil (frontend) del módulo de autenticación y registro de agricultores para **CacaoScan AI Vision**, desarrollada en React Native utilizando **Expo** y **TypeScript**.

---

## 🛠️ Tecnologías y Stack

* **React Native + Expo (v56+)**
* **TypeScript** para tipado estático seguro.
* **React Navigation (Stack)** para el flujo de pantallas.
* **Zustand** para la gestión del estado global de sesión.
* **Axios** con interceptores automáticos para renovación de `accessToken` mediante `refreshToken`.
* **React Hook Form + Zod** para la validación de formularios en tiempo real con feedback inmediato.
* **Expo Secure Store** para almacenar de forma segura las credenciales y tokens JWT (nunca en AsyncStorage simple).
* **NetInfo** para el soporte offline-aware, detectando pérdida de conectividad y mostrando un banner informativo en la UI.

---

## 📋 Requisitos Previos

* **Node.js (v18 o superior)**
* **NPM** (o tu gestor de paquetes favorito)
* **Expo Go** (aplicación móvil instalada en tu smartphone iOS/Android) o un emulador de Android/iOS configurado.

---

## 🚀 Guía de Configuración Local (Menos de 10 Minutos)

### 1. Instalar Dependencias
Desde la raíz del directorio `cacao-frontend-app`, ejecuta:

```bash
npm install
```

### 2. Configurar Variable de Entorno
Copia el archivo `.env.example` para crear tu `.env` de desarrollo:

```bash
cp .env.example .env
```

Edita el archivo `.env` y define `EXPO_PUBLIC_API_URL` con la IP de tu backend.
* **Si usas emulador Android:** usa `http://10.0.2.2:8080/api/v1`
* **Si usas emulador iOS / dispositivo real:** usa la IP local de tu ordenador en la red Wi-Fi (ej. `http://192.168.1.50:8080/api/v1`)

### 3. Levantar Servidor de Desarrollo de Expo
Inicia el empaquetador Metro:

```bash
npm run start
# O
npx expo start
```

### 4. Abrir la Aplicación
* **En dispositivo físico:** Escanea el código QR que aparece en la terminal desde la app **Expo Go** (Android) o la cámara nativa (iOS). Asegúrate de estar en la misma red Wi-Fi que tu ordenador.
* **En emulador:** Presiona `a` para Android o `i` para iOS en la terminal.

---

## 🧭 Estructura de Navegación del Módulo

El flujo de pantallas configurado es:
* **Si hay sesión activa (tokens en SecureStore):** Se salta la pantalla de Login y va directamente a la pantalla principal.
* **Si no hay sesión:**
  * `LoginScreen` (Iniciar Sesión)
    * `ForgotPasswordScreen` (Olvidé mi Contraseña) -> `ResetPasswordScreen` (Restablecer Contraseña)
    * `RegisterScreen` (Registro de Agricultor)
