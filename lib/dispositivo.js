/*
*   Nodbus. Slave Controller for ModBus TCP protocol in Node.JS 
*   Copyright (C) 2016 Manuel Martínez Automatización y Pesaje Industrial, S.L.U.
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var utilidades = require('./utilidades');
var log = new require('./logger');
var objCola = require('./cola');
var funciones = require('./funciones');
var BufferMB = require('./BufferMB');

var events = require('events').EventEmitter;
var util = require('util');

var operacionComprobacion = 0;
var msComprobacion = 1000;

var tiempoMaximoRespuesta = 3500;
var reintentos = 3;

var msCiclo = 15;





/**
 * Constructor
 * @param nombre String
 * @param controlador String
 * @param tags Object
 * @param opciones Object
 */
var dispositivo = function(nombre, controlador, tags, opciones) {
    // Se establecen los objetos comunes a todos los dispositivos
    this.info = Object();
    this.info.nombre = nombre;
    this.conectado = false;
    this.noErrores = true;
    this.cola = new objCola();
    this.funciones = new funciones(this);
    this.log = new log(this.info.nombre);
    this.tags = tags;
    this.tiposMB = {
        BYTE: {bits: 8, funcion: 'Int8', endian: false},
        INT: {bits: 16, funcion: 'Int16', endian: true},
        UINT: {bits: 16, funcion: 'UInt16', endian: true},
        DINT: {bits: 32, funcion: 'Int32', endian: true},
        UDINT: {bits: 32, funcion: 'UInt32', endian: true}, 
        FLOAT: {bits: 32, funcion: 'Float', endian: true},
        DOUBLE: {bits: 64, funcion: 'Double', endian: true}
    }
    new require('./drivers/'+controlador+'/driver') (this); // Se integran las funciones del driver con el dispositivo actual
    utilidades.mezclarObjetos(opciones, this.info); // Se establecen los objetos particulares de cada dispositivo
    
    this.conectarRecursiva(); // Se conecta el dispositivo
    
    
    
    
    /*
     * Se establecen los eventos o Listeners que serán ejecutados en TODOS los dispositivos, sean del driver que sea
     */
    utilidades.eventos(this, {
        conexion: function() {
            this.conectado = true;
            this.comenzarCiclo();
            this.comprobarConexion();
            
            this.log.info("Conectado");
            this.emit("conectado");
        },
        desconexion: function() {
            if (this.conectado) {
                this.conectado = false;
               
                this.cola.vaciar();
                
                this.log.error("Desconectado");
                this.emit("desconectado");
                this.conectarRecursiva();
            }
        },
        datosRecibidos: function(datos) {
            var buffer = utilidades.extractorBuffer(datos, this.estructuraCabecera, this.tiposMB, this.bytesPorPosicion, this.endian, this.noErrores);   
            if (typeof this.cola.operaciones[buffer.operacion] === 'undefined') {
                this.cola.prepararCola();
                return false;
            }
            
            var numOperacion = buffer.operacion;
            var operacion = this.cola.operaciones[numOperacion];
            var numPaquete = operacion.paquete;
            var paquete = this.cola.paquetes[numPaquete];

            if ((paquete.operaciones.lastIndexOf(numOperacion) === -1) || (typeof this.funciones[paquete.funcion+"Callback"] === 'undefined')) {
                this.cola.prepararCola();
                return false;
            }
            
            var informacion = this.funciones[paquete.funcion+"Callback"](buffer, numOperacion, operacion, numPaquete, paquete);            
            if (paquete.operaciones.length == 1) {
                if (this.cola.quitarPaquete(numPaquete)) {
                    if (typeof paquete.callback == 'function') {
                        if (typeof informacion == 'object') {
                            var array = utilidades.obj2arr(informacion);
                        }

                        paquete.callback.apply(this, array);
                    }
                }
            } else {
                this.cola.quitarOperacion(numOperacion);
            }
            
            this.cola.prepararCola();
            return true;
        },
        error: function() {
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


/*
 * Bucle encargado de continuar con la cola cuando existan elementos disponibles
 */
dispositivo.prototype.comenzarCiclo = function() {
    var _self = this;
    setInterval(function() {
        _self.enviarSiguientePeticion();
    }, msCiclo);
}









/**********************************************************
 *
 *      ALIAS PARA LAS FUNCIONES MODBUS
 *      
 **********************************************************/

/*
 * Función de lectura estándar
 */
dispositivo.prototype.leer = dispositivo.prototype.leerMultiplesRegistros = dispositivo.prototype.readMultipleRegisters = function(arrTags, callback) {
    // Si no ha definido array de tags, se presupone que quiere leerlos todos
    if (typeof arrTags === "function") {
        callback = arrTags;
        var tags = new Array();

        for (t in this.tags) {
            tags.push(t);
        }

        if (tags.length != 0) {
            this.leer(tags, callback);
        } else {
            this.log.error("No se ha definido ningún Tag para el dispositivo actual");
        }
    } else {
        this.funciones.fc3(arrTags, callback);
    }
}

/*
 * OBSOLETO. Lee todos los tags que han sido creados en el dispositivo
 */
dispositivo.prototype.leerTodo = dispositivo.prototype.readAll = function(callback) {
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

/*
 * Función de escritura estándar
 */
dispositivo.prototype.escribir = dispositivo.prototype.escribirMultiplesRegistros = dispositivo.prototype.writeMultipleRegisters = function(tag, valor, callback) {
    this.funciones.fc16(tag, valor, callback);
}


/*
 * Función de escritura de palabra. No es compatible con todos los dispositivos
 */
dispositivo.prototype.escribirPalabra = dispositivo.prototype.escribirRegistro = dispositivo.prototype.writeSingleRegister = function(tag, valor, callback) {
    this.funciones.fc6(tag, valor, callback);
}








/**********************************************************
 *
 *      FUNCIONES DE CONTROL Y PROCESO DE PETICIONES
 *      
 **********************************************************/

/**
 * Función encargada de obtener la siguiente petición en la cola y enviar la siguiente
 */
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
                _self.log.error("Se ha activado el timeout de la operacion "+operacion+". [ "+this.reintentos+" de "+reintentos+" ]. Se procede a reconectar el dispositivo...");
                _self.emit("desconexion");
                clearInterval(this);
            } else {
                _self.cola.ordenLlegada.unshift(operacion);
                _self.log.error("Se ha activado el timeout de la operacion "+operacion+". [ "+this.reintentos+" de "+reintentos+" ]. Se procede a preparar la cola para repetir la operación...");
                _self.cola.prepararCola();
            }
        }, tiempoMaximoRespuesta);
    }
    
    return true;
}