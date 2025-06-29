class Profesor {
  constructor(nombre, avatar) {
    this.nombre = nombre;
    this.avatar = avatar;
  }

  render() {
    return `
      <div class="flex items-center gap-2">
        <img src="${this.avatar}" class="rounded-full w-6 h-6" />
        <div class="text-sm">
          <div>${this.nombre}</div>
        </div>
      </div>
    `;
  }
}

class Curso {
  constructor(titulo, descripcion, profesor) {
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.profesor = profesor;
  }

  render() {
    return `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold text-lg mb-2">${this.titulo}</h3>
        ${this.profesor.render()}
        <p class="text-sm mt-2 text-gray-600">${this.descripcion}</p>
      </div>
    `;
  }
}

class AppDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.cursos = [];
    this.cargarCursos();
    this.mostrarCursos();
  }

  cargarCursos() {
    const profe = new Profesor("Nombre docente", "https://i.imgur.com/w1URBmK.png");

    this.cursos = [
      new Curso("Curso de Html", "Fundamentos del desarrollo web", profe),
      new Curso("Curso JavaScript", "Aprende lógica y DOM", profe),
      new Curso("Curso CSS", "Estilos modernos", profe),
      new Curso("“Quote”", "Curso especial", profe),
      new Curso("Curso Frameworks", "React, Vue, Angular", profe)
    ];
  }

  mostrarCursos() {
    this.container.innerHTML = this.cursos.map(curso => curso.render()).join('');
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  new AppDashboard("courseContainer");
});
