// Clase que representa al Usuario
class Usuario {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  validar() {
    // Validación ficticia para el ejemplo
    return this.email === "admin@ejemplo.com" && this.password === "admin123";
  }
}

// Clase que maneja el inicio de sesión
class LoginController {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.iniciarSesion();
    });
  }

  iniciarSesion() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = new Usuario(email, password);

    if (user.validar()) {
      alert('Bienvenido ' + email);
      // Aquí podrías redirigir, guardar token, etc.
    } else {
      alert('Correo o contraseña incorrectos');
    }
  }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  new LoginController('loginForm');
});
