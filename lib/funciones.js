/* 
 * NodBus por Manuel Martínez Automatización y Pesaje Industrial, S.L.U. se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Todas las funciones de este fichero serán utilizadas dentro del entorno modbus principal. This hará referencia a este.
 */

var utilidades = require('./utilidades');
var util = require("util");
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
    var _self = this;
    
    // En caso de no tratarse de un array, sino de un objeto, se convierte en array para facilitar su manejo
    if (!util.isArray(arrTags)) { arrTags = [arrTags]; }    
    
    // La información de Tags recibida es convertida a un objeto que contendrá la información completa de dichos tags, como posición y tipo.
    var tags = utilidades.arrTags2objTags(arrTags, this.dispositivo.tags);
    
    // En caso necesario, la información de Tags se mapeará a nuevas posiciones definidas
    if (typeof this.dispositivo.mapeado === "object") {
        utilidades.mapearTags(tags, this.dispositivo.mapeado);
    }
    
    var rangos = utilidades.obtenerRangos(tags, this.dispositivo.tiposMB, this.dispositivo.bytesPorPosicion, bytesMaximosPorPeticion);
    var paquete = this.dispositivo.cola.nuevoPaquete('fc3', { datos: {} }, callback);    
    rangos.forEach(function(rango) {
        var operacion = _self.dispositivo.cola.obtenerOperacion();
        var buffer = _self.dispositivo.buffers[_self.dispositivo.cola.paquetes[paquete]["funcion"]](operacion, rango.inicio, rango.cantidad);

        var parametrosExtra = {tags: rango.tags, posicionInicial: rango.inicio};
        _self.dispositivo.cola.agregarOperacion(operacion, buffer, paquete, parametrosExtra);
    });
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
 *  @return objeto con la información que se recibirá en el callback
 */
funciones.prototype.fc3Callback = function(buffer, numOperacion, operacion, numPaquete, paquete) {
    buffer.posicionInicial = operacion.posicionInicial;
    
    // Obtenemos la información a recuperar posteriormente
    var datos = utilidades.extraerTags(buffer, operacion.tags);
    
    // Guardamos los datos obtenidos en el paquete correspondiente
    this.dispositivo.cola.acumularDatos(paquete, datos);
    
    var informacion = new Object();
    informacion["datos"] = paquete.datos;
    
    return informacion;
}




/**********************************************************
 *
 *      CONTROL DE ESCRITURA DE UNA PALABRA (FC6)
 *      
 **********************************************************/

/*
 * Función encargada de escribir un sólo dato en el dispositivo
 * 
 * @tag nombre del tag o posición MB
 * @valor número a guardar
 * @callback función
 */
funciones.prototype.fc6 = function(tag, valor, callback) {
    if (typeof tag == 'string') {
        tag = this.dispositivo.tags[tag];
    }
    
    // En caso necesario, la información del tag se mapeará a nuevas posiciones definidas
    if (typeof this.dispositivo.mapeado === "object") {
        if (typeof this.dispositivo.mapeado[tag.posicion] === 'number') {
            tag.alias = tag.posicion;
            tag.posicion = this.dispositivo.mapeado[tag.posicion];
        }
    }
    
    var paquete = this.dispositivo.cola.nuevoPaquete('fc6', callback);
    var operacion = this.dispositivo.cola.obtenerOperacion();

    var buffer = this.dispositivo.buffers[this.dispositivo.cola.paquetes[paquete]["funcion"]](operacion, tag.posicion, tag.tipo, valor);
    this.dispositivo.cola.agregarOperacion(operacion, buffer, paquete);
}

/*
 * Callback
 * 
 * @return true
 */
funciones.prototype.fc6Callback = function() {
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




/**********************************************************
 *
 *      CONTROL DE ESCRITURA (FC16)
 *      
 **********************************************************/

/*
 * Función encargada de escribir datos en el dispositivo
 * 
 * @tag nombre del tag o posición MB
 * @valor número a guardar
 * @callback función
 */
funciones.prototype.fc16 = function(tag, valor, callback) {
    if (typeof tag == 'string') {
        tag = this.dispositivo.tags[tag];
    }
    
    // En caso necesario, la información del tag se mapeará a nuevas posiciones definidas
    if (typeof this.dispositivo.mapeado === "object") {
        if (typeof this.dispositivo.mapeado[tag.posicion] === 'number') {
            tag.alias = tag.posicion;
            tag.posicion = this.dispositivo.mapeado[tag.posicion];
        }
    }
    
    var paquete = this.dispositivo.cola.nuevoPaquete('fc16', callback);
    var operacion = this.dispositivo.cola.obtenerOperacion();

    var buffer = this.dispositivo.buffers[this.dispositivo.cola.paquetes[paquete]["funcion"]](operacion, tag.posicion, tag.tipo, valor);
    this.dispositivo.cola.agregarOperacion(operacion, buffer, paquete);
}

/*
 * Callback
 * 
 * @return true
 */
funciones.prototype.fc16Callback = function() {
    return true;
}