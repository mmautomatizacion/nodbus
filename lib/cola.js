/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Lleva la cola de proceso de los datos a recibir por cada dispositivo ModBus
 */

var events = require('events').EventEmitter;
var utilidades = require('./utilidades');
var operacionInicial = 1;

/*
 * Constructor
 */
var cola = function() {
    this.ordenLlegada = new Array();
    this.paquetes = new Object();
    this.operaciones = new Object();
    this.preparada = true;
    
    /*
     *  Eventos de la cola
     */
    utilidades.eventos(this, {
        prepararCola: function() {
            this.preparada = true;
            this.emit("colaPreparada");
        },
        ocuparCola: function() {
            this.preparada = false;
            this.emit("colaOcupada");
        },
        operacionFinalizada: function(operacion) {
            this.quitar(operacion);
        }
    });
    
    // Función de llamada a los eventos personalizados
    events.call(this);
}
cola.prototype = Object.create(events.prototype);





cola.prototype.nuevoPaquete = function(funcion, informacion, callback) {
    if (typeof informacion === 'function') {
        callback = informacion;
        informacion = null;
    }
    
    var numPaquete = 1;
    while (typeof this.paquetes[numPaquete] !== 'undefined') {
        numPaquete++;
    }
    var paquete = this.paquetes[numPaquete] = new Object;
    paquete["funcion"] = funcion;
    paquete["operaciones"] = new Array();
    paquete["datos"] = new Object();
    paquete["callback"] = callback;
    
    if (informacion !== null) {
        utilidades.mezclarObjetos(informacion, paquete);
    }
      
    return numPaquete;
}

cola.prototype.agregarOperacion = function(operacion, buffer, paquete, informacion) {
    if (operacion === null) {
        operacion = this.obtenerOperacion();
    }
    
    var objOperacion = new Object;
    
    objOperacion.buffer = buffer; 
    objOperacion.paquete = paquete;
    var info = null;
    for (i in informacion) {
        info = informacion[i];
        
        objOperacion[i] = info;
    }
    
    this.operaciones[operacion] = objOperacion;
    this.ordenLlegada.push(operacion);
    this.paquetes[paquete].operaciones.push(operacion);
    this.emit("operacionAgregada", operacion);
    return operacion;
}











/**********************************************************
 *
 *      GESTIÓN DE OPERACIONES
 *      
 **********************************************************/

/*
 * Obtiene el número o código identificador de la operación. Este crea el objeto para evitar problemas a la hora de tratarlo
 */
cola.prototype.obtenerOperacion = function() {
    var operacion = operacionInicial;
    while (typeof this.operaciones[operacion] !== 'undefined') {
        operacion++;
    }
    this.operaciones[operacion] = new Object;
    return operacion;
}



/*
 *  Quita una operación de la cola
 *  
 *  @operacion Operación a quitar
 */
cola.prototype.quitarPaquete = function(paquete) {
    var o;
    var operacion;
    for (o in this.paquetes[paquete].operaciones) {
        operacion = this.paquetes[paquete].operaciones[o];
        this.quitarOperacion(operacion);
    }
    delete this.paquetes[paquete];
}





/**********************************************************
 *
 *      OPERACIONES DE GESTIÓN DE LA COLA
 *      
 **********************************************************/

/*
 * Agrega una nueva operación de lectura a la cola
 * 
 * @operacion Código o identificador de la operación de lectura
 * @buffer objeto buffer para ser enviado
 * @informacion objeto con información extra a adjuntar
 * @callback Función a realizar una vez sean recibidos los datos
 */

/*
 *  Quita una operación de la cola
 *  
 *  @operacion Operación a quitar
 */
cola.prototype.quitarOperacion = function(operacion) {
    var paquete = this.operaciones[operacion].paquete;
    this.paquetes[paquete].operaciones.splice(this.paquetes[paquete].operaciones.lastIndexOf(operacion), 1);    
    delete this.operaciones[operacion];
    return true;
}

/*
 * Limpia por completo la cola de procesos actual
 */
cola.prototype.vaciar = function() {
    var paquete;
    for (paquete in this.paquetes) {
        if (!isNaN(paquete)) {
            this.quitarPaquete(paquete);
        }
    }
    this.ordenLlegada = new Array();
    this.preparada = true;
}

/*
 *  Se comprueba si existe algún elemento en espera dentro de la cola. En caso positivo, se envía la petición del elemento. Se utiliza un sistema FIFO.
 */
cola.prototype.siguienteOperacion = function() {
    if ((this.preparada) && (this.ordenLlegada.length != 0)) {
        this.emit("ocuparCola");
        var operacion = this.ordenLlegada.shift(); // Se coge el primer elemento, el primero entrar en la cola, y se elimina del array
        return operacion;
    } else {
        return false;
    }
}


/**********************************************************
 *
 *      MANEJO DE INFORMACIÓN
 *      
 **********************************************************/


/*
 * Crea un array con los buffer para ser unidos y procesados posteriormente
 * 
 * @operacionOriginal número de la operación de la que parten
 * @datos nuevos datos a añadir
 */
cola.prototype.acumularDatos = function(paquete, datos) {
    if (typeof paquete.datos === 'undefined') {
        paquete.datos = new Object();
    }
    
    var nombreDato;
    for (nombreDato in datos) {
        var dato = datos[nombreDato];
        
        paquete.datos[nombreDato] = dato;
    }
}

module.exports = exports = cola;