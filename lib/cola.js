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
 *      GESTIÓN DE PAQUETES
 *      
 **********************************************************/

/*
 * Crea un nuevo paquete, que estará formado por una o varias operaciones
 * @funcion cadena de texto. Función ModBus a utilizar
 * @informacion objeto. Información adicional
 * @callback función
 * 
 * @return número de paquete
 */
cola.prototype.nuevoPaquete = function(funcion, informacion, callback) {
    // Es posible que no se añada información adicional. Por ello, se comprueba si el campo información se refiere en realidad a la función callback
    if (typeof informacion === 'function') {
        callback = informacion;
        informacion = null;
    }
    
    // Obtenemos el siguiente paquete a utilizar
    var numPaquete = 1;
    while (typeof this.paquetes[numPaquete] !== 'undefined') {
        numPaquete++;
    }
    
    // Se crea el paquete con toda la información predeterminada
    var paquete = this.paquetes[numPaquete] = new Object;
    paquete["funcion"] = funcion;
    paquete["operaciones"] = new Array();
    paquete["datos"] = new Object();
    paquete["callback"] = callback;
    
    // Se añade información extra al paquete
    if (informacion !== null) {
        utilidades.mezclarObjetos(informacion, paquete);
    }
      
    return numPaquete;
}


/*
 *  Elimina un paquete determinado junto con sus operaciones
 *  
 *  @paquete Paquete a eliminar
 */
cola.prototype.quitarPaquete = function(paquete) {
    var o;
    var operacion;

    for (o in this.paquetes[paquete].operaciones) {
        operacion = this.paquetes[paquete].operaciones[o];
        this.quitarOperacion(operacion);
    }
    delete this.paquetes[paquete];
    
    return true;
}





/**********************************************************
 *
 *      GESTIÓN DE OPERACIONES
 *      
 **********************************************************/

/*
 * Agrega una operación a un paquete determinado que ya debe estar creado
 * 
 * @operacion número de operación. Si es nulo, se obtendrá
 * @buffer buffer a enviar
 * @paquete número de paquete
 * @informacion objeto con información adicional
 *
 * @return número de operación
 */
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


/*
 *  Quita una operación de la cola
 *  
 *  @operacion Operación a quitar
 */
cola.prototype.quitarOperacion = function(operacion) {
    var paquete = this.operaciones[operacion].paquete;
    this.paquetes[paquete].operaciones.splice(this.paquetes[paquete].operaciones.lastIndexOf(operacion), 1);
    clearInterval(this.operaciones[operacion].timeOut);
    delete this.operaciones[operacion];
    return true;
}


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






/**********************************************************
 *
 *      OPERACIONES DE GESTIÓN DE LA COLA
 *      
 **********************************************************/


/*
 * El estado de la cola se cambia a "preparado"
 */
cola.prototype.prepararCola = function() {
    this.preparada = true;
}

/*
 * El estado de la cola cambia a "no preparado"
 */
cola.prototype.ocuparCola = function() {
    this.preparada = false;
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
        this.ocuparCola();
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
 * Acumula todos los datos obtenidos en las distintas operaciones de un mismo paquete
 * 
 * @paquete número de paquete al que pertenece la operación
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