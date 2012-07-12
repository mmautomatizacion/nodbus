/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Lleva la cola de proceso de los datos a recibir por cada dispositivo ModBus
 */

var events = require('events').EventEmitter;
var operacionInicial = 1;

/*
 * Constructor
 */
var cola = function() {
    this.ordenLlegada = new Array();
    this.listo = true;
    
    // Función de llamada a los eventos personalizados
    events.call(this);
}
cola.prototype = Object.create(events.prototype);

/*
 * Agrega una nueva operación de lectura a la cola
 * 
 * @operacion Código o identificador de la operación de lectura
 * @peticion Datos de lo que se desea hacer, como la posición a leer, tipo de dato...
 * @callback Función a realizar una vez sean recibidos los datos
 */
cola.prototype.agregar = function(operacion, buffer, informacion, callback) {
    if (operacion === null) {
        operacion = this.obtenerOperacion();
    }
    this[operacion]['buffer'] = buffer;
    this[operacion]['callback'] = callback;
        
    for (i in informacion) {
        info = informacion[i];
        
        this[operacion][i] = info;
    }
    
    this.ordenLlegada.push(operacion);
    this.emit("elementoAgregado");
    return operacion;
}

/*
 *  Se comprueba si existe algún elemento en espera dentro de la cola. En caso positivo, se envía la petición del elemento. Se utiliza un sistema FIFO.
 */
cola.prototype.siguienteOperacion = function() {
    if ((this.listo) && (this.ordenLlegada.length != 0)) {
        this.listo = false;
        var operacion = this.ordenLlegada.shift(); // Se coge el primer elemento, el primero entrar en la cola, y se elimina del array
        return operacion;
    } else {
        return false;
    }
}

/*
 *  Quita una operación de la cola
 *  @operacion Operación a quitar
 */
cola.prototype.quitar = function(operacion) {
    clearTimeout(this[operacion].timeOut);
    delete this[operacion];
}

/*
 * Limpia por completo la cola de procesos actual
 */
cola.prototype.vaciar = function() {
    for (i in this) {
        if (!isNaN(i)) {
            this.quitar(i);
        }
    }
    this.ordenLlegada = new Array();
    this.listo = true;
}

/*
 * Obtiene el número o código identificador de la operación. Este crea el objeto para evitar problemas a la hora de tratarlo
 */
cola.prototype.obtenerOperacion = function() {
    var operacion = operacionInicial;
    while (typeof this[operacion] !== 'undefined') {
        operacion++;
    }
    this[operacion] = new Object;
    return operacion;
}

/*
 * Crea un array con los buffer para ser unidos y procesados posteriormente
 */
cola.prototype.acumularDatos = function(operacionOriginal, datos) {
    if (typeof this[operacionOriginal].datosAcumulados === 'undefined') {
        this[operacionOriginal].datosAcumulados = new Object();
    }
    
    if (typeof this[operacionOriginal].paquetesRecibidos === 'undefined') {
        this[operacionOriginal].paquetesRecibidos = 0;
    }
    
    for (nombreDato in datos) {
        var dato = datos[nombreDato];
        
        this[operacionOriginal].datosAcumulados[nombreDato] = dato;
    }
    this[operacionOriginal].paquetesRecibidos++;
}

module.exports = exports = cola;