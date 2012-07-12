/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * Todas las funciones de este fichero serán utilizadas dentro del entorno modbus principal. This hará referencia a este.
 */

var utilidades = require('./utilidades');
var bytesMaximosPorPeticion = 254;

/*
 * Constructor
 */
var funciones = function(dispositivo) {
    this.dispositivo = dispositivo;
}
module.exports = exports = funciones;



/**********************************************************
 *
 *      FC3
 *      
 **********************************************************/

/*
 * Lectura de datos. Es la función estándar
 * 
 * @arrTags array con los tags a leer
 * @callback función
 */
funciones.prototype.fc3 = function(arrTags, callback) {
    var tags = utilidades.arrTags2objTags(arrTags, this.dispositivo.tags);        
    var rangos = utilidades.obtenerRangos(tags, this.dispositivo.tiposMB, this.dispositivo.bytesPorPosicion, bytesMaximosPorPeticion);
    var paquete = this.dispositivo.cola.nuevoPaquete('fc3', callback);    
    
    for (r in rangos) {
        var rango = rangos[r];

        var operacion = this.dispositivo.cola.obtenerOperacion();
        var buffer = this.dispositivo.buffers[this.dispositivo.cola.paquetes[paquete]["funcion"]](operacion, rango.inicio, rango.cantidad);

        var parametrosExtra = {tags: rango.tags, posicionInicial: rango.inicio};
        this.dispositivo.cola.agregarOperacion(operacion, buffer, paquete, parametrosExtra);
    }
}

/*
 *  Funciones a realizar cuando se reciban los datos de la operación
 *  
 *  @buffer objeto bufferExtraer con el buffer obtenido
 *  @numOperacion número de operación
 *  @operacion objeto de operación
 *  @numPaquete número de paquete
 *  @paquete objeto de paquete
 *  
 *  @return boleano
 */
funciones.prototype.fc3Callback = function(buffer, numOperacion, operacion, numPaquete, paquete) {
    // Guardamos los datos obtenidos en el paquete correspondiente
    buffer.posicionInicial = operacion.posicionInicial;
    var datos = utilidades.extraerTags(buffer, operacion.tags);
    this.dispositivo.cola.acumularDatos(paquete, datos);
    
    return true;
}

/**********************************************************
 *
 *      CONTROL DE CONEXIÓN (FC8)
 *      
 **********************************************************/

/*
 * Esta función devuelve información de error o sin sentido. Se utiliza para evitar la activación del TimeOut
 * 
 * @operacion número de operación
 * @callback función
 */
funciones.prototype.controlConexion = function(operacion, callback) {
    var paquete = this.dispositivo.cola.nuevoPaquete('controlConexion', callback);

    var buffer = this.dispositivo.buffers[this.dispositivo.cola.paquetes[paquete]["funcion"]](operacion);
    this.dispositivo.cola.agregarOperacion(operacion, buffer, paquete);
}

/*
 * Callback
 * 
 * @return true
 */
funciones.prototype.controlConexionCallback = function() {
    return true;
}