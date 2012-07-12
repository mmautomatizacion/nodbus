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
cola.prototype.agregar = function(operacion, buffer, informacion, callback) {
    if (operacion === null) {
        operacion = this.obtenerOperacion();
    }
    
    var objOperacion = new Object;
    
    objOperacion['buffer'] = buffer;
    objOperacion['callback'] = callback;
    
    var info = null;
    for (i in informacion) {
        info = informacion[i];
        
        objOperacion[i] = info;
    }
    
    this[operacion] = objOperacion;
    this.ordenLlegada.push(operacion);
    this.emit("operacionAgregada", operacion);
    return operacion;
}

/*
 *  Quita una operación de la cola
 *  
 *  @operacion Operación a quitar
 */
cola.prototype.quitar = function(operacion) {
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
    this.preparada = true;
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
    while (typeof this[operacion] !== 'undefined') {
        operacion++;
    }
    this[operacion] = new Object;
    return operacion;
}


/*
 *  Se comprueba si existe algún elemento en espera dentro de la cola. En caso positivo, se envía la petición del elemento. Se utiliza un sistema FIFO.
 */
cola.prototype.siguienteOperacion = function() {
    if ((this.preparada) && (this.ordenLlegada.length != 0)) {
        this.emit("ocuparCola");
        var operacion = this.ordenLlegada.shift(); // Se coge el primer elemento, el primero entrar en la cola, y se elimina del array
        console.log("La operacion "+operacion+" ha sido eliminada de ordenLlegada para ser procesada");
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