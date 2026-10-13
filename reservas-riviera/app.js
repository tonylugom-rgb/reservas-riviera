// === ESTADO DE LA APLICACIÓN ===
let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let precioMaximo = 2000;

// === REFERENCIAS AL DOM ===
const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const filtroPrecioMax = document.querySelector("#filtroPrecioMax");
const valPrecioMax = document.querySelector("#valPrecioMax");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");
const estado = document.querySelector("#estado");
const btnVaciar = document.querySelector("#btnVaciar");
const mensajeNotificacion = document.querySelector("#mensajeNotificacion");

// === CARGA ASÍNCRONA DE DATOS ===
async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias");
    
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    mostrarNotificacion("Error al conectar con la base de datos de experiencias", "error");
    console.error(error);
  }
}

// === NOTIFICACIONES DINÁMICAS (Sin alert) (Reto 6) ===
function mostrarNotificacion(mensaje, tipo = "exito") {
  mensajeNotificacion.textContent = mensaje;
  mensajeNotificacion.className = `notificacion ${tipo}`;
  setTimeout(() => {
    mensajeNotificacion.className = "notificacion oculta";
  }, 3500);
}

// === FILTRADO Y ORDENAMIENTO ===
function obtenerResultados() {
  let resultados = [...experiencias];

  if (categoriaActual !== "todas") {
    resultados = resultados.filter(e => e.categoria === categoriaActual);
  }

  if (textoBusqueda !== "") {
    resultados = resultados.filter(e => e.nombre.toLowerCase().includes(textoBusqueda));
  }

  // Filtro de precio máximo (Reto 2)
  resultados = resultados.filter(e => e.precio <= precioMaximo);

  if (ordenActual === "ascendente") resultados.sort((a, b) => a.precio - b.precio);
  if (ordenActual === "descendente") resultados.sort((a, b) => b.precio - a.precio);

  return resultados;
}

// === RENDERIZAR CATÁLOGO ===
function actualizarCatalogo() {
  const resultados = obtenerResultados();

  if (resultados.length === 0) {
    catalogo.innerHTML = '<p class="sin-resultados">No se encontraron experiencias</p>';
    estado.textContent = "0 resultados";
    return;
  }

  catalogo.innerHTML = resultados.map(e => `
    <article class="tarjeta">
      <div class="imagen">${e.icono}</div>
      <div class="informacion">
        <span class="categoria">${e.categoria}</span>
        <h3>${e.nombre}</h3>
        <p>Cupo disponible: ${e.cupo}</p>
        <p class="precio">$${e.precio} MXN</p>
        <label>Personas:
          <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
        </label>
        <button class="btn-reservar" data-id="${e.id}">Agregar</button>
      </div>
    </article>
  `).join("");

  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}

function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach(boton => {
    boton.addEventListener("click", () => agregarReserva(Number(boton.dataset.id)));
  });
}

// === AGREGAR Y MODIFICAR RESERVAS ===
function agregarReserva(id) {
  const experiencia = experiencias.find(e => e.id === id);
  const inputCantidad = document.querySelector(`#cantidad-${id}`);
  const cantidad = Number(inputCantidad.value);

  if (cantidad < 1 || cantidad > experiencia.cupo) {
    mostrarNotificacion("Cantidad no válida o supera el cupo máximo.", "error");
    return;
  }

  const existente = reservas.find(r => r.experienciaId === id);

  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad;
    if (nuevaCantidad > experiencia.cupo) {
      mostrarNotificacion("La cantidad total supera el cupo disponible.", "error");
      return;
    }
    existente.cantidad = nuevaCantidad;
    existente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({
      experienciaId: id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad,
      subtotal: experiencia.precio * cantidad
    });
  }

  mostrarNotificacion(`Reserva añadida: ${experiencia.nombre}`);
  mostrarReservas();
}

// Disminuir o aumentar la cantidad desde la reservación (Reto 3)
function cambiarCantidadReserva(id, cambio) {
  const reserva = reservas.find(r => r.experienciaId === id);
  const experiencia = experiencias.find(e => e.id === id);

  if (!reserva) return;

  const nuevaCantidad = reserva.cantidad + cambio;

  if (nuevaCantidad <= 0) {
    eliminarReserva(id);
    return;
  }

  if (nuevaCantidad > experiencia.cupo) {
    mostrarNotificacion("No hay más cupo disponible para esta experiencia.", "error");
    return;
  }

  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = reserva.cantidad * reserva.precio;
  mostrarReservas();
}

// === MOSTRAR RESERVAS Y TOTALES ===
function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN";
    totalPersonas.textContent = "0";
    return;
  }

  listaReservas.innerHTML = reservas.map(r => `
    <article class="item-reserva">
      <div>
        <strong>${r.nombre}</strong>
        <p>$${r.precio} MXN por persona</p>
        <div class="controles-cantidad">
          <button class="btn-cantidad" onclick="cambiarCantidadReserva(${r.experienciaId}, -1)">-</button>
          <span><strong>${r.cantidad}</strong> pers.</span>
          <button class="btn-cantidad" onclick="cambiarCantidadReserva(${r.experienciaId}, 1)">+</button>
        </div>
      </div>
      <div>
        <strong>$${r.subtotal} MXN</strong>
        <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
      </div>
    </article>
  `).join("");

  // Cálculo con reduce() para total general e importe (Reto 4)
  const sumaTotal = reservas.reduce((acc, r) => acc + r.subtotal, 0);
  const sumaPersonas = reservas.reduce((acc, r) => acc + r.cantidad, 0);

  total.textContent = `$${sumaTotal} MXN`;
  totalPersonas.textContent = sumaPersonas;

  agregarEventosEliminar();
}

function agregarEventosEliminar() {
  document.querySelectorAll(".btn-eliminar").forEach(boton => {
    boton.addEventListener("click", () => eliminarReserva(Number(boton.dataset.id)));
  });
}

function eliminarReserva(id) {
  reservas = reservas.filter(r => r.experienciaId !== id);
  mostrarNotificacion("Experiencia eliminada de tu reservación", "error");
  mostrarReservas();
}

// Vaciar reservación con confirmación (Reto 5)
function vaciarReservacion() {
  if (reservas.length === 0) {
    mostrarNotificacion("Tu reservación ya está vacía", "error");
    return;
  }

  const confirmar = confirm("¿Estás seguro de que deseas vaciar toda tu reservación?");
  if (confirmar) {
    reservas = [];
    mostrarReservas();
    mostrarNotificacion("Se ha vaciado tu reservación correctamente");
  }
}

// === EVENT LISTENERS Y INICIALIZACIÓN ===
buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});

filtroPrecioMax.addEventListener("input", () => {
  precioMaximo = Number(filtroPrecioMax.value);
  valPrecioMax.textContent = precioMaximo;
  actualizarCatalogo();
});

btnVaciar.addEventListener("click", vaciarReservacion);

// Inicio de la aplicación
cargarExperiencias();