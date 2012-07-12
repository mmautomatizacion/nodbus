/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * Todas las funciones de este fichero serán utilizadas dentro del entorno modbus principal. This hará referencia a este.
 */

var utilidades = require('./utilidades');
var bytesMaximosPorPeticion = 254;


exports.fc3 = function(arrTags, callback) {
    var tags = utilidades.arrTags2objTags(arrTags, this.tags);        
    var rangos = utilidades.obtenerRangos(tags, this.tiposMB, this.bytesPorPosicion, bytesMaximosPorPeticion);
    var paquete = this.cola.nuevoPaquete('fc3', callback);    
    
    for (r in rangos) {
        var rango = rangos[r];

        var operacion = this.cola.obtenerOperacion();
        var buffer = this.buffers[this.cola.paquetes[paquete]["funcion"]](operacion, rango.inicio, rango.cantidad);

        var parametrosExtra = {tags: rango.tags, posicionInicial: rango.inicio};
        this.cola.agregarOperacion(operacion, buffer, paquete, parametrosExtra);
    }
}

exports.fc8 = function(operacion, callback) {
    var paquete = this.cola.nuevoPaquete('fc8', callback);

    var buffer = this.buffers[this.cola.paquetes[paquete]["funcion"]](operacion);
    this.cola.agregarOperacion(operacion, buffer, paquete);
}