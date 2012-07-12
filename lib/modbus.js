/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var utilidades = require('./utilidades');
var log = new require('./logger');
var objCola = require('./cola');
var funciones = require('./funciones');

var events = require('events').EventEmitter;
var util = require('util');

var operacionComprobacion = 0;
var msComprobacion = 700;

var msCiclo = 10;

/*
 * Constructor
 */
var dispositivo = function(nombre, controlador, opciones) {    
    // Se establecen los objetos comunes a todos los dispositivos
    this.nombre = nombre;
    this.conectado = false;
    this.cola = new objCola();
    this.tiempoMaximoRespuesta = 1300;
    this.tags = {}; // Los TAGS deberán estar ordenados numéricamente
    this.tiposMB = {
        BYTE: {bits: 8, funcion: 'Int8', endian: false}, 
        INT: {bits: 16, funcion: 'Int16', endian: true}, 
        DINT: {bits: 32, funcion: 'Int32', endian: true}, 
        FLOAT: {bits: 32, funcion: 'Float', endian: true},
        DOUBLE: {bits: 64, funcion: 'Double', endian: true}
    }
    
    new require('./drivers/'+controlador+'/driver') (this);
    
    utilidades.mezclarObjetos(opciones, this); // Se establecen los objetos particulares de cada dispositivo
    utilidades.mezclarObjetos(funciones, this); // Se crean las funciones de lectura y escritura en el dispositivo actual
    //this.bufferComprobacion = this.buffers.fc8(operacionComprobacion); // Se crea el buffer de comprobación a raíz del driver especificado. Este buffer se utilizará para comprobar la conexión
    this.log = new log(this.nombre); // Se establece el gestor de logs
    
    this.ciclo(); // Se activa el ciclo de comprobación de elementos en la cola
    this.conectarRecursiva(); // Se conecta el dispositivo
    
    /*
     * Se establecen los eventos o Listeners que serán ejecutados en TODOS los dispositivos, sean del driver que sea
     */
    utilidades.eventos(this, {
        conexion: function() {
            this.conectado = true;
            //this.comprobarConexion();
            
            this.log.info("Conectado");
        },
        desconexion: function() {
            if (this.conectado) {
                this.conectado = false;
               
                this.cola.vaciar();
                
                this.log.error("Desconectado");
                this.conectarRecursiva();
            }
        },
        datosRecibidos: function(datos) {
            this.procesarDatosRecibidos(datos);
        },
        error: function(err) {
            if (this.conectado) {
                this.log.error("Se ha producido un error desconocido");
            }
        },
        siguientePeticion: function() {
            this.enviarSiguientePeticion();
        }
    });
    
    // Eventos relativos a la cola de proceso
    var _self = this;
    utilidades.eventos(this.cola, {
        colaPreparada: function() {
            //_self.emit("siguientePeticion");
        },
        operacionAgregada: function() {
            //_self.emit("siguientePeticion");
        },
        operacionFinalizada: function(operacion) {
        }
    });
    
    events.call(this); // Función de llamada a los eventos personalizados
}
dispositivo.prototype = Object.create(events.prototype);
module.exports = exports = dispositivo;


/**********************************************************
 *
 *      FUNCIONES DE CONEXIÓN Y CONTROL
 *      
 **********************************************************/

/*
* Conecta de forma recursiva con el dispositivo mientras la conexión no se haya establecido.
*/
dispositivo.prototype.conectarRecursiva = function() {
    if (this.conectado === false) {
        this.conectar();

        var _self = this;
        setTimeout(function() {
            _self.conectarRecursiva();
        }, msComprobacion);
    }
}

/*
 * Envía la petición de una posición determinada para, a través de la respuesta, comprobar que el dispositivo está correctamente conectado
 */
dispositivo.prototype.comprobarConexion = function() {
    if (this.conectado) {
        var _self = this;
        this.fc8(operacionComprobacion, function() {
            setTimeout(function() {
                _self.comprobarConexion();
            }, msComprobacion);
        });
    }
}


dispositivo.prototype.ciclo = function() {
    this.emit("siguientePeticion");
    
    var _self = this;
    setTimeout(function() {
        _self.ciclo();
    }, msCiclo);
}




/**********************************************************
 *
 *      FUNCIONES DE LECTURA DE DATOS
 *      
 **********************************************************/

/*
* Crea un objeto a partir de los Tags para leer datos determinados. Utiliza la función por defecto del controlador
*/
dispositivo.prototype.leer = function(arrTags, callback) {
    
    this.fc3(arrTags, callback);
    
    return true;

    var operacionInicial = null;
    for (r in rangos) {
        var infoRango = rangos[r];

        var operacion = this.cola.obtenerOperacion();
        var buffer = this.generarBufferLectura(operacion, infoRango.inicio, infoRango.cantidad);

        var parametrosExtra = {tags: infoRango.tags, posicionInicial: infoRango.inicio};            
        if (operacionInicial == null) {
            operacionInicial = operacion;
            parametrosExtra["paquetes"] = rangos.length;
        }
        parametrosExtra["paqueteOriginal"] = operacionInicial;

        this.cola.agregar(operacion, buffer, parametrosExtra, callback);
        callback = null;
    }
}


/*
* Lee todos los tags que han sido creados en el dispositivo
*/
dispositivo.prototype.leerTodo = function(callback) {
    var tags = new Array();

    for (t in this.tags) {
        tags.push(t);
    }

    if (tags.length != 0) {
        this.leer(tags, callback);
    } else {
        this.log.error("No se ha definido ningún Tag para el dispositivo actual");
    }
}


/**********************************************************
 *
 *      FUNCIONES DE CONTROL Y PROCESO DE PETICIONES
 *      
 **********************************************************/

dispositivo.prototype.enviarSiguientePeticion = function() {
    var operacion = this.cola.siguienteOperacion();
    
    this.log.aviso("Se solicita el envío de la siguiente operación: "+operacion);
    
    if (operacion === false) {
        return false;
    }
    
    this.log.aviso("Se envía la petición de la operación "+operacion);
    if (this.enviarPeticion(this.cola.operaciones[operacion].buffer)) {
        this.log.aviso("Petición enviada correctamente");
        
        var _self = this;
        
        /*if (typeof this.cola[operacion].timeOut !== 'undefined') {
            clearTimeout(this.cola[operacion].timeOut);
        }*/
        
        /*this.cola.operaciones[operacion].timeOut = setTimeout(function() {
            if (typeof this.veces === 'undefined') {
                this.veces = 0;
            } else {
                this.veces++;
            }
            
            _self.log.error("Se ha activado el timeout de la operacion "+operacion+" por "+this.veces+" vez. Se procede a preparar la cola para repetir la operación...");
            _self.cola.ordenLlegada.unshift(operacion);
            _self.cola.emit("prepararCola");
        }, this.tiempoMaximoRespuesta);*/
    }
    
    return true;
}



dispositivo.prototype.procesarDatosRecibidos = function(data) { 
    var buffer = utilidades.bufferExtraer(data, this.estructuraCabecera, this.tiposMB, this.bytesPorPosicion, this.endian);   
    if (typeof this.cola.operaciones[buffer.operacion] === 'undefined') {
        return false;
    }

    var numOperacion = buffer.operacion;
    var operacion = this.cola.operaciones[numOperacion];
    var numPaquete = operacion.paquete;
    var paquete = this.cola.paquetes[numPaquete];
    
    if (paquete.operaciones.lastIndexOf(numOperacion) === -1) {
        return false;
    }
    
    // Anulamos el tiempo de espera para reintentar obtener la operación
    //clearTimeout(cola.timeOut);
    
    
    // Guardamos los datos obtenidos en el paquete correspondiente
    buffer.posicionInicial = operacion.posicionInicial;
    var datos = utilidades.extraerTags(buffer, operacion.tags);
    this.cola.acumularDatos(paquete, datos);
    this.cola.quitarOperacion(numOperacion);
    
    //this.log.aviso("Se ha acumulado la operación "+numOperacion+" en el paquete "+numPaquete+". Quedan "+paquete.operaciones.length+" operaciones");
    if (paquete.operaciones.length == 0) {
        if (typeof paquete.callback == 'function') {
            paquete.callback(paquete.datos);
        }

        //this.log.info("Finalizada toda la trama del paquete "+numPaquete);
        this.cola.quitarPaquete(numPaquete);
    }
    this.log.aviso("Datos recibidos y procesados de la operación "+numOperacion);
    this.cola.emit("prepararCola");
    return true;
}