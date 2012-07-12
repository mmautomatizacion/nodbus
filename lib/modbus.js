/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var utilidades = require('./utilidades');
var cola = require('./cola');
var events = require('events').EventEmitter;
//exports.dispositivos = new Object();

var bytesMaximosPorPeticion = 254;
var operacionComprobacion = 0;
var msComprobacion = 700;

/**
 * Constructor
 */
var dispositivo = function(controlador, opciones) {    
    // Se establecen los objetos comunes a todos los dispositivos
    this.conectado = false;
    this.cola = new cola();
    this.tiempoMaximoRespuesta = 2000;
    this.tags = {}; // Los TAGS deberán estar ordenados numéricamente
    this.tiposMB = {
        BYTE: {bits: 8, funcion: 'Int8', endian: false}, 
        INT: {bits: 16, funcion: 'Int16', endian: true}, 
        DINT: {bits: 32, funcion: 'Int32', endian: true}, 
        FLOAT: {bits: 32, funcion: 'Float', endian: true},
        DOUBLE: {bits: 64, funcion: 'Double', endian: true}
    }
    
    // Se establecen los objetos pertenecientes al driver seleccionado y se integran con el objeto actual
    driver = require('./drivers/'+controlador);
    controlador = new driver();
    
    for (nombreObjeto in controlador) {
        objeto = controlador[nombreObjeto];
        this[nombreObjeto] = objeto;
    }
    
    // Se establecen los objetos particulares de cada dispositivo
    for (opcion in opciones) {
        this[opcion] = opciones[opcion];
    }
    

    /**
    * Se conecta el dispositivo
    */  
    this.conectarRecursiva();
    
    
    /**
     * Se establecen los eventos o Listeners que serán ejecutados en TODOS los dispositivos, sean del driver que sea
     */
    utilidades.eventos(this, {
        conexion: function() {
            this.conectado = true;
            this.comprobacion();
        },
        desconexion: function() {
            if (this.conectado) {
                this.conectado = false;
                this.cola.vaciar();
                
                this.conectarRecursiva();
            }
        }
    });
    
    // Eventos relativos a la cola de proceso
    var _self = this;
    this.cola.on('elementoAgregado', function() {
        _self.siguientePeticion();
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
dispositivo.prototype.comprobacion = function() {
    buff = this.generarBufferComprobacion(operacionComprobacion);
    if (this.conectado) {
        this.cola[operacionComprobacion] = new Object();
        var _self = this;
        this.cola.agregar(operacionComprobacion, buff, {operacionControl: true}, function() {
            setTimeout(function() {
                _self.comprobacion();
            }, msComprobacion);
        });
    }
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
    tags = utilidades.arrTags2objTags(arrTags, this.tags);        
    rangos = utilidades.obtenerRangos(tags, this.tiposMB, this.bytesPorPosicion, bytesMaximosPorPeticion);

    operacionInicial = null;
    for (r in rangos) {
        infoRango = rangos[r];

        operacion = this.cola.obtenerOperacion();
        buffer = this.generarBufferLectura(operacion, infoRango.inicio, infoRango.cantidad);

        parametrosExtra = {tags: infoRango.tags, posicionInicial: infoRango.inicio};            
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
    tags = new Array();

    for (t in this.tags) {
        tags.push(t);
    }

    if (tags.length != 0) {
        this.leer(tags, callback);
    } else {
        console.error("Imposible leer datos. Ningún Tag definido");
    }
}



dispositivo.prototype.prepararDatos = function(data) {           
    buffer = utilidades.bufferExtraer(data, this.estructuraCabecera, this.tiposMB, this.bytesPorPosicion, this.endian);
    cola = this.cola[buffer.operacion];

    this.cola.listo = true;
    this.siguientePeticion();

    if (typeof cola !== 'undefined') {                
        buffer.posicionInicial = cola.posicionInicial;
        datos = utilidades.extraerTags(buffer, cola.tags)
        datosEnviar = null;


        if (typeof cola.paqueteOriginal !== 'undefined') {
            paqueteAcumulativo = cola.paqueteOriginal;                   
        } else {
            paqueteAcumulativo = buffer.operacion;
        }
        this.cola.acumularDatos(paqueteAcumulativo, datos);

        if (buffer.operacion != paqueteAcumulativo) {
            this.cola.quitar(buffer.operacion);
        }

        if ((this.cola[paqueteAcumulativo].paquetes == this.cola[paqueteAcumulativo].paquetesRecibidos) || (typeof this.cola[paqueteAcumulativo].paquetes === 'undefined')) {
            if (typeof this.cola[paqueteAcumulativo].callback == 'function') {
                this.cola[paqueteAcumulativo].callback(this.cola[paqueteAcumulativo].datosAcumulados);                        
            }

            this.cola.quitar(paqueteAcumulativo);
        }
    }
}

dispositivo.prototype.siguientePeticion = function() {
    operacion = this.cola.siguienteOperacion();
    
    if (operacion === false) {
        return false;
    }
    
    if (this.enviarPeticion(this.cola[operacion].buffer)) {
        this.cola[operacion].timeOut = setTimeout(function() {
            if (this.conectado) {
                this.cola.listo = true;
                this.siguientePeticion();
            }
        }, this.tiempoMaximoRespuesta);
    } else {
        this.siguientePeticion();
    }
    
    return true;
}