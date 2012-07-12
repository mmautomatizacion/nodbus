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
var msComprobacion = 1000;
var reintentos = 2;





/*
 * Constructor
 */
var dispositivo = function(nombre, controlador, opciones) {    
    // Se establecen los objetos comunes a todos los dispositivos
    this.nombre = nombre;
    this.conectado = false;
    this.cola = new objCola();
    this.funciones = new funciones(this);
    this.log = new log(this.nombre);
    this.tiempoMaximoRespuesta = 2000;
    this.tags = {}; // Los TAGS deberán estar ordenados numéricamente
    this.tiposMB = {
        BYTE: {bits: 8, funcion: 'Int8', endian: false}, 
        INT: {bits: 16, funcion: 'Int16', endian: true}, 
        DINT: {bits: 32, funcion: 'Int32', endian: true}, 
        FLOAT: {bits: 32, funcion: 'Float', endian: true},
        DOUBLE: {bits: 64, funcion: 'Double', endian: true}
    }    
    new require('./drivers/'+controlador+'/driver') (this); // Se integran las funciones del driver con el dispositivo actual
    utilidades.mezclarObjetos(opciones, this); // Se establecen los objetos particulares de cada dispositivo
    
    
    

    this.conectarRecursiva(); // Se conecta el dispositivo
    
    
    
    
    /*
     * Se establecen los eventos o Listeners que serán ejecutados en TODOS los dispositivos, sean del driver que sea
     */
    utilidades.eventos(this, {
        conexion: function() {
            this.conectado = true;
            this.ciclo();
            this.comprobarConexion();
            
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
            var buffer = utilidades.bufferExtraer(datos, this.estructuraCabecera, this.tiposMB, this.bytesPorPosicion, this.endian);   
            if (typeof this.cola.operaciones[buffer.operacion] === 'undefined') {
                return false;
            }

            var numOperacion = buffer.operacion;
            var operacion = this.cola.operaciones[numOperacion];
            var numPaquete = operacion.paquete;
            var paquete = this.cola.paquetes[numPaquete];

                        
            if ((paquete.operaciones.lastIndexOf(numOperacion) === -1) || (typeof this.funciones[paquete.funcion+"Callback"] === 'undefined')) {
                return false;
            }
            
            if (this.funciones[paquete.funcion+"Callback"](buffer, numOperacion, operacion, numPaquete, paquete)) {
                if (paquete.operaciones.length == 1) {
                    if (typeof paquete.callback == 'function') {
                        paquete.callback(paquete.datos);
                    }
                    
                    this.cola.quitarPaquete(numPaquete);
                } else {
                    this.cola.quitarOperacion(numOperacion);
                }
            }
            
            this.cola.prepararCola();
            return true;
        },
        error: function(err) {
            if (this.conectado) {
                this.log.error("Se ha producido un error. Reconectamos el dispositivo...");
                this.emit("desconexion");
            }
        }
    });
    
    
    
    events.call(this); // Función de llamada a los eventos personalizados
}
dispositivo.prototype = Object.create(events.prototype);
module.exports = exports = dispositivo;





dispositivo.prototype.ciclo = function() {
    this.enviarSiguientePeticion();
    
    var _self = this;
    setTimeout(function() {
        _self.ciclo();
    }, 15);
}



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
        this.funciones.controlConexion(operacionComprobacion, function() {
            setTimeout(function() {
                _self.comprobarConexion();
            }, msComprobacion);
        });
    }
}









/**********************************************************
 *
 *      ALIAS PARA LAS FUNCIONES MODBUS
 *      
 **********************************************************/

/*
 * Función de lectura estándar
 */
dispositivo.prototype.leer = function(arrTags, callback) {
    this.funciones.fc3(arrTags, callback);
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
    if (typeof this.cola.operaciones[operacion] === 'undefined') {
        return false;
    }
    
    if (this.enviarPeticion(this.cola.operaciones[operacion].buffer)) {       
        if (typeof this.cola.operaciones[operacion].timeOut !== 'undefined') {
            return false;
        }
        
        var _self = this;
        this.cola.operaciones[operacion].timeOut = setInterval(function() {
            if (typeof this.reintentos === 'undefined') {
                this.reintentos = 0;
            }
            this.reintentos++;
                        
            if (this.reintentos == reintentos) {
                _self.emit("desconexion");
                clearInterval(this);
            } else {
                _self.cola.ordenLlegada.unshift(operacion);
                _self.log.error("Se ha activado el timeout de la operacion "+operacion+". Se procede a preparar la cola para repetir la operación...");
                _self.cola.prepararCola();
            }
        }, this.tiempoMaximoRespuesta);
    }
    
    return true;
}