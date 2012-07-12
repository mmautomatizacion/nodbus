/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var utilidades = require('./utilidades');
var cola = require('./cola');
exports.dispositivos = new Object();

var bytesMaximosPorPeticion = 254;
var operacionComprobacion = 0;
var msComprobacion = 700;


var nuevoDispositivo = exports.nuevoDispositivo = function(nombre, controlador, opciones) {
    
    /**
     * Se aplica el driver correspondiente al seleccionado
     */
    driver = require('./drivers/'+controlador);
    dispositivo = new driver();
    dispositivo.nombre = nombre;
    dispositivo.conectado = false;
    dispositivo.cola = new cola();
    dispositivo.tags = {}; // Los TAGS deberán estar ordenados numéricamente
    dispositivo.tiposMB = {
        BYTE: {bits: 8, funcion: 'Int8', endian: false}, 
        INT: {bits: 16, funcion: 'Int16', endian: true}, 
        DINT: {bits: 32, funcion: 'Int32', endian: true}, 
        FLOAT: {bits: 32, funcion: 'Float', endian: true},
        DOUBLE: {bits: 64, funcion: 'Double', endian: true}
    }
    for (opcion in opciones) {
        dispositivo[opcion] = opciones[opcion];
    }
    

    /**
    * Se conecta el dispositivo
    */  
    reconectar();
    
    
    /**
     * Se establecen los eventos o Listeners que serán ejecutados en TODOS los dispositivos, sean del driver que sea
     */
    utilidades.eventos(dispositivo, {
        conexion: function() {
            console.log("Se ha conectado el dispositivo '"+dispositivo.nombre+"'");
            dispositivo.conectado = true;
            comprobacion();

        },
        desconexion: function() {
            if (dispositivo.conectado) {
                console.log("Se ha desconectado el dispositivo '"+dispositivo.nombre+"'");
                dispositivo.conectado = false;
                dispositivo.cola.vaciar();
                
                reconectar();
            }
            console.log("DESCONEXION");
        },
        prepararDatos: function(data) {           
            buffer = utilidades.bufferExtraer(data, dispositivo.estructuraCabecera);
            cola = dispositivo.cola[buffer.operacion];
            
            dispositivo.cola.listo = true;
            dispositivo.cola.procesarPeticion();
            
            if (typeof cola !== 'undefined') {                
                buffer.posicionInicial = cola.posicionInicial;
                datos = utilidades.extraerTags(buffer, cola.tags)
                datosEnviar = null;
                
                
                if (typeof cola.paqueteOriginal !== 'undefined') {
                    paqueteAcumulativo = cola.paqueteOriginal;                   
                } else {
                    paqueteAcumulativo = buffer.operacion;
                }
                dispositivo.cola.acumularDatos(paqueteAcumulativo, datos);
                
                if (buffer.operacion != paqueteAcumulativo) {
                    dispositivo.cola.quitar(buffer.operacion);
                }
                
                if ((dispositivo.cola[paqueteAcumulativo].paquetes == dispositivo.cola[paqueteAcumulativo].paquetesRecibidos) || (typeof dispositivo.cola[paqueteAcumulativo].paquetes === 'undefined')) {
                    if (typeof dispositivo.cola[paqueteAcumulativo].callback == 'function') {
                        dispositivo.cola[paqueteAcumulativo].callback(dispositivo.cola[paqueteAcumulativo].datosAcumulados);                        
                    }
                    
                    dispositivo.cola.quitar(paqueteAcumulativo);
                }
            }
        }
    });
    
    
    /*
    * Crea un objeto a partir de los Tags para leer datos determinados. Utiliza la función FC3
    */
    dispositivo.leer = function(arrTags, callback) {
        
        tags = utilidades.arrTags2objTags(arrTags);        
        rangos = utilidades.obtenerRangos(tags, bytesMaximosPorPeticion);
        
        operacionInicial = null;
        for (r in rangos) {
            infoRango = rangos[r];
            
            operacion = dispositivo.cola.obtenerOperacion();
            buffer = dispositivo.generarBufferLectura(operacion, infoRango.inicio, infoRango.cantidad);
            
            parametrosExtra = {tags: infoRango.tags, posicionInicial: infoRango.inicio};            
            if (operacionInicial == null) {
                operacionInicial = operacion;
                parametrosExtra["paquetes"] = rangos.length;
            }
            parametrosExtra["paqueteOriginal"] = operacionInicial;
            
            dispositivo.cola.agregar(operacion, buffer, parametrosExtra, callback);
            callback = null;
        }
    }
    
    /*
     * Lee todos los tags que han sido creados en el dispositivo
     */
    dispositivo.leerTodo = function(callback) {
        tags = new Array();
        
        for (t in this.tags) {
            tags.push(t);
        }
        
        if (tags.length != 0) {
            dispositivo.leer(tags, callback);
        } else {
            console.error("Imposible leer datos. Ningún Tag definido");
        }
    }
    
    
    
    exports.dispositivos[nombre] = dispositivo;
}



/*
* Intenta volver a conectar con el dispositivo asociado
*/
function reconectar() {
    if (dispositivo.conectado === false) {
        dispositivo.conectar();

        setTimeout(dispositivo.reconectar, msComprobacion);
    }
}

/*
 * Envía la petición de una posición determinada para, a través de la respuesta, comprobar que el dispositivo está correctamente conectado
 */
function comprobacion() {
    buff = dispositivo.generarBufferComprobacion(operacionComprobacion);
    if (dispositivo.conectado) {
        dispositivo.cola[operacionComprobacion] = new Object();
        dispositivo.cola.agregar(operacionComprobacion, buff, {operacionControl: true}, function() {
            setTimeout(comprobacion, msComprobacion);
        });
    }
}