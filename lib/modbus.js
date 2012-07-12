/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var utilidades = require('./utilidades');
var log = new require('./logger');
var objCola = require('./cola');
var events = require('events').EventEmitter;
var util = require('util');

var bytesMaximosPorPeticion = 254;

var operacionComprobacion = 0;
var bufferComprobacion = null;
var msComprobacion = 700;

var msCiclo = 1000;

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

    // Se establecen los objetos pertenecientes al driver seleccionado y se integran con el objeto actual
    var driver = require('./drivers/'+controlador);
    controlador = new driver();
    
    for (var nombreObjeto in controlador) {
        this[nombreObjeto] = controlador[nombreObjeto];
    }
    
    // Se establecen los objetos particulares de cada dispositivo
    for (var opcion in opciones) {
        this[opcion] = opciones[opcion];
    }
    
    // Se establece el gestor de logs
    this.log = new log(this.nombre);
    // Se crea el buffer de comprobación a raíz del driver especificado. Este buffer se utilizará para comprobar la conexión
    bufferComprobacion = this.generarBufferComprobacion(operacionComprobacion);
    // Se activa el ciclo de comprobación de elementos en la cola
    this.ciclo();
    

    // Se conecta el dispositivo
    this.conectarRecursiva();
    
    
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
            _self.log.aviso("Operacion "+operacion+" eliminada");
        }
    });
    
    // Función de llamada a los eventos personalizados
    events.call(this);    
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
        this.cola[operacionComprobacion] = new Object();
        var _self = this;
        this.cola.agregar(operacionComprobacion, bufferComprobacion, {operacionControl: true}, function() {
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
    var tags = utilidades.arrTags2objTags(arrTags, this.tags);        
    var rangos = utilidades.obtenerRangos(tags, this.tiposMB, this.bytesPorPosicion, bytesMaximosPorPeticion);

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
    
    if (operacion === false) {
        return false;
    }
        
    this.log.info("Se envía el buffer de la operación "+operacion);
    if (this.enviarPeticion(this.cola[operacion].buffer)) {
        var _self = this;
        
        /*if (typeof this.cola[operacion].timeOut !== 'undefined') {
            clearTimeout(this.cola[operacion].timeOut);
        }*/
        
        this.cola[operacion].timeOut = setTimeout(function() {
            if (typeof this.veces === 'undefined') {
                this.veces = 0;
            } else {
                this.veces++;
            }
            
            _self.log.error("Se ha activado el timeout de la operacion "+operacion+" por "+this.veces+" vez. Se procede a preparar la cola para repetir la operación...");
            _self.cola.ordenLlegada.unshift(operacion);
            _self.cola.emit("prepararCola");
        }, this.tiempoMaximoRespuesta);
    }
    
    return true;
}



dispositivo.prototype.procesarDatosRecibidos = function(data) {           
    var buffer = utilidades.bufferExtraer(data, this.estructuraCabecera, this.tiposMB, this.bytesPorPosicion, this.endian);
    var cola = this.cola[buffer.operacion];
    var paqueteAcumulativo = null;
    
    if (typeof cola === 'undefined') {
        return false;
    }
    
    // Anulamos el tiempo de espera para reintentar obtener la operación
    clearTimeout(cola.timeOut);
    
    
    buffer.posicionInicial = cola.posicionInicial;
    var datos = utilidades.extraerTags(buffer, cola.tags)


    if (typeof cola.paqueteOriginal !== 'undefined') {
        paqueteAcumulativo = cola.paqueteOriginal;                   
    } else {
        paqueteAcumulativo = buffer.operacion;
    }
    this.cola.acumularDatos(paqueteAcumulativo, datos);
    
    this.log.aviso("Se acumula el paquete "+buffer.operacion+" en el proceso "+paqueteAcumulativo+". Almacenados "+this.cola[paqueteAcumulativo].paquetesRecibidos+" de "+this.cola[paqueteAcumulativo].paquetes+" paquetes");
    if ((this.cola[paqueteAcumulativo].paquetes == this.cola[paqueteAcumulativo].paquetesRecibidos) || (typeof this.cola[paqueteAcumulativo].paquetes === 'undefined')) {
        if (typeof this.cola[paqueteAcumulativo].callback == 'function') {
            this.cola[paqueteAcumulativo].callback(this.cola[paqueteAcumulativo].datosAcumulados);
        }

        this.log.info("Finalizada toda la trama del proceso "+paqueteAcumulativo);
        this.cola.emit("operacionFinalizada", paqueteAcumulativo);
    }
    
    if (buffer.operacion != paqueteAcumulativo) {
        this.cola.emit("operacionFinalizada", buffer.operacion);
    }
    
    this.cola.emit("prepararCola");
    return true;
}