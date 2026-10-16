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


// Funciones para abrir y cerrar Modales
function openAuthModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = modal.querySelector('div');
        if (content) content.classList.remove('scale-95');
    }, 10);
}

function closeAuthModal(modal) {
    if (!modal) return;
    modal.classList.add('opacity-0');
    const content = modal.querySelector('div');
    if (content) content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Vincular eventos del DOM cuando la página termine de cargar
document.addEventListener('DOMContentLoaded', () => {
    const modalLogin = document.getElementById('modal-login');
    const modalRegister = document.getElementById('modal-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const loginError = document.getElementById('login-error');
    const regError = document.getElementById('reg-error');

    // Botones para abrir modales
    document.getElementById('btn-open-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(modalLogin);
    });

    document.getElementById('btn-open-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal(modalRegister);
    });

    // Botones para cerrar modales
    document.getElementById('btn-close-login')?.addEventListener('click', () => closeAuthModal(modalLogin));
    document.getElementById('btn-close-register')?.addEventListener('click', () => closeAuthModal(modalRegister));

    // Observador del estado de autenticación (Actualiza la barra superior)
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

    // Login con Correo y Contraseña
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

    // Registro con Correo y Contraseña
    formRegister?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (regError) regError.classList.add('hidden');

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
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

    // Login / Registro con Google
    document.getElementById('btn-google-login')?.addEventListener('click', async () => {
        try {
            await auth.signInWithPopup(googleProvider);
            closeAuthModal(modalLogin);
            closeAuthModal(modalRegister);
        } catch (error) {
            alert("Error con Google: " + error.message);
        }
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        auth.signOut();
    });
});

// Función auxiliar para traducir errores de Firebase
function obtenerMensajeError(code) {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'El correo ya está registrado.';
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
            return 'Correo o contraseña incorrectos.';
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres.';
        default:
            return 'Ocurrió un error. Intenta de nuevo.';
    }
}
