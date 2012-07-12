/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Contiene las distintas funciones para conectar con ModBus
 */

var net = require('net');
var msTimeout = 3000;

exports.TCP = function(ip, puerto) {
    var conexion = net.connect(puerto, ip);
    conexion.setTimeout(msTimeout);
    return conexion;
}

/*exports.UDP = function() {
    
}

exports.Serial = function() {
    
}*/