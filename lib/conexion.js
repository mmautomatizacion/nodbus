/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Contiene las distintas funciones para conectar con ModBus
 */

var net = require('net');

var msTimeout = 1200;

exports.TCP = function(ip, puerto) {
    conexion = net.connect(puerto, ip);
    conexion.setTimeout(msTimeout);
    conexion.setKeepAlive(true);
    return conexion;
}

/*exports.UDP = function() {
    
}

exports.Serial = function() {
    
}*/