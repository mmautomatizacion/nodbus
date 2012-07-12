/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var utilidades = require('./../../utilidades');

var buffers = function(dispositivo) {
    this.dispositivo = dispositivo;
}
module.exports = exports = buffers;

buffers.prototype.fc3 = function(operacion, posicionInicial, cantidad) {
    var buffer = utilidades.buffer(this.dispositivo.tiposMB, this.dispositivo.endian)
        .INT(operacion)             // ID de la operación
        .INT(0)                     // ID de protocolo 
        .INT(6)                     // Tamaño de buffer
        .BYTE(this.dispositivo.id)  // ID de la unidad
        .BYTE(3)                    // Función
        .INT(posicionInicial)       // Número de referencia
        .INT(cantidad)              // Cantidad de datos a leer
        .generar();
    return buffer;
}


buffers.prototype.fc8 = function(operacion) {
    var buffer = utilidades.buffer(this.dispositivo.tiposMB, this.dispositivo.endian)
        .INT(operacion)             // ID de la operación
        .INT(0)                     // ID de protocolo 
        .INT(6)                     // Tamaño de buffer
        .BYTE(this.dispositivo.id)  // ID de la unidad
        .BYTE(8)                    // Operación
        .generar();
    return buffer;
}