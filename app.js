// 1. CONFIGURACIÓN DE FIREBASE (Reemplaza con tus datos reales de la consola)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEZkGjUe7UYz3pGpvHgZt-Y35yH_948gI",
  authDomain: "lms-kanban.firebaseapp.com",
  projectId: "lms-kanban",
  storageBucket: "lms-kanban.firebasestorage.app",
  messagingSenderId: "968740905716",
  appId: "1:968740905716:web:dc698577bc2730927b34a1",
  measurementId: "G-V5HG9S6GQR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// URL de tu API en Google Apps Script
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzD6jT1CP7Og4HfmFFG9xNnTJEwS7BMuvb9p1yMpiI--HnGcWv1Gb1GWylbuTVYmFgf6A/exec";

// DOM Elements & Modales
const modalLogin = document.getElementById('modal-login');
const modalRegister = document.getElementById('modal-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const loginError = document.getElementById('login-error');
const regError = document.getElementById('reg-error');

// Abrir / Cerrar Modales
document.getElementById('btn-open-login')?.addEventListener('click', () => openAuthModal(modalLogin));
document.getElementById('btn-close-login')?.addEventListener('click', () => closeAuthModal(modalLogin));
document.getElementById('btn-open-register')?.addEventListener('click', () => openAuthModal(modalRegister));
document.getElementById('btn-close-register')?.addEventListener('click', () => closeAuthModal(modalRegister));

function openAuthModal(modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div')?.classList.remove('scale-95');
    }, 10);
}

function closeAuthModal(modal) {
    modal.classList.add('opacity-0');
    modal.querySelector('div')?.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// --- AUTENTICACIÓN CON FIREBASE ---

// 1. Observador del estado de la sesión (Detecta si el usuario inicia o cierra sesión)
auth.onAuthStateChanged((user) => {
    const authSection = document.getElementById('user-auth-section');
    const loggedSection = document.getElementById('user-logged-section');
    const displayName = document.getElementById('user-display-name');

    if (user) {
        authSection?.classList.add('hidden');
        loggedSection?.classList.remove('hidden');
        if (displayName) displayName.textContent = user.displayName || user.email;
    } else {
        authSection?.classList.remove('hidden');
        loggedSection?.classList.add('hidden');
        if (displayName) displayName.textContent = '';
    }
});

// 2. Registro con Correo y Contraseña
formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (regError) regError.classList.add('hidden');

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Actualizar el nombre de usuario en Firebase Profile
        await userCredential.user.updateProfile({ displayName: name });
        closeAuthModal(modalRegister);
        formRegister.reset();
    } catch (error) {
        if (regError) {
            regError.textContent = obtenerMensajeError(error.code);
            regError.classList.remove('hidden');
        }
    }
});

// 3. Inicio de Sesión con Correo y Contraseña
formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.classList.add('hidden');

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal(modalLogin);
        formLogin.reset();
    } catch (error) {
        if (loginError) {
            loginError.textContent = obtenerMensajeError(error.code);
            loginError.classList.remove('hidden');
        }
    }
});

// 4. Inicio de Sesión / Registro con Google (Popup)
document.getElementById('btn-google-login')?.addEventListener('click', async () => {
    try {
        await auth.signInWithPopup(googleProvider);
        if (modalLogin) closeAuthModal(modalLogin);
        if (modalRegister) closeAuthModal(modalRegister);
    } catch (error) {
        alert("Error al iniciar sesión con Google: " + error.message);
    }
});

// 5. Cerrar Sesión
document.getElementById('btn-logout')?.addEventListener('click', () => {
    auth.signOut();
});

// Helper de errores traducidos
function obtenerMensajeError(code) {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'El correo ya está registrado en otra cuenta.';
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
            return 'Correo o contraseña incorrectos.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        default:
            return 'Ocurrió un error al procesar la solicitud.';
    }
}
