/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Lleva la cola de proceso de los datos a recibir por cada dispositivo ModBus
 */

//var msSeparacion = 0;
var operacionInicial = 1;
var tiempoMaximoRespuesta = 2000;

/*
 * Constructor
 */
var cola = function() {
    this.ordenLlegada = new Array();
    this.listo = true;
}

/*
 * Agrega una nueva operación de lectura a la cola
 * 
 * @operacion Código o identificador de la operación de lectura
 * @peticion Datos de lo que se desea hacer, como la posición a leer, tipo de dato...
 * @callback Función a realizar una vez sean recibidos los datos
 */
cola.prototype.agregar = function(operacion, buffer, informacion, callback) {
    this[operacion]['buffer'] = buffer;
    this[operacion]['callback'] = callback;
        
    for (i in informacion) {
        info = informacion[i];
        
        this[operacion][i] = info;
    }
    
    tamano = this.ordenLlegada.length;
    this.ordenLlegada.push(operacion);
    if (tamano == 0) {
        // Comenzamos la cuenta
        setTimeout(this.procesarPeticion, 0);
    }
}

/*
 *  Se comprueba si existe algún elemento en espera dentro de la cola. En caso positivo, se envía la petición del elemento. Se utiliza un sistema FIFO.
 */
cola.prototype.procesarPeticion = function() {
    if ((dispositivo.cola.listo) && (dispositivo.cola.ordenLlegada.length != 0)) {
        dispositivo.cola.listo = false;
        //setTimeout(function() {
            operacion = dispositivo.cola.ordenLlegada.shift(); // Se coge el primer elemento, el primero entrar en la cola, y se elimina del array
            if (dispositivo.enviarPeticion(dispositivo.cola[operacion].buffer)) {
                dispositivo.cola[operacion].timeOut = setTimeout(function() {
                    if (dispositivo.conectado) {
                        dispositivo.cola.listo = true;
                        dispositivo.cola.procesarPeticion();
                    }
                }, tiempoMaximoRespuesta);
            } else {
                dispositivo.cola.procesarPeticion();
            }
        //}, msSeparacion)
    }
}

/*
 *  Quita una operación de la cola
 *  @operacion Operación a quitar
 */
cola.prototype.quitar = function(operacion) {
    clearTimeout(dispositivo.cola[operacion].timeOut);
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
    operacion = operacionInicial;
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
        dato = datos[nombreDato];
        
        this[operacionOriginal].datosAcumulados[nombreDato] = dato;
    }
    this[operacionOriginal].paquetesRecibidos++;
}

module.exports = exports = cola;