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

var utilidades = require('./../../utilidades');

/*
 * Constructor
 */
var buffers = function(dispositivo) {
    this.dispositivo = dispositivo;
}
module.exports = exports = buffers;


/*
 * Buffer de la función FC3
 * 
 * @operacion número de operación
 * @posicionInicial posición desde la que comenzar a leer
 * @cantidad cantidad de datos a leer
 * 
 * @return objeto buffer
 */
buffers.prototype.fc3 = function(operacion, posicionInicial, cantidad) {
    var tamBuffer = 5; // Tamaño de buffer. Este dato identifica la cantidad de Bytes incluidos en el paquete a parte de este mismo dato
    var buffer = utilidades.generadorBuffer(this.dispositivo.tiposMB, this.dispositivo.endian, this.dispositivo.noErrores)
        .UINT(operacion)                // ID de la operación
        .UINT(0)                        // ID de protocolo 
        .UINT(tamBuffer + 1)            // Tamaño de buffer.
        .BYTE(this.dispositivo.info.id) // ID de la unidad
        .BYTE(3)                        // Función
        .UINT(posicionInicial)          // Número de referencia
        .UINT(cantidad)                 // Cantidad de datos a leer
        .generar();
    return buffer;
}



/*
 * Buffer de la función FC6
 * 
 * @operacion número de operación
 * @posicion posición en la que escribir el dato
 * @tipo tipo de dato a escribir
 * @valor valor a escribir
 * 
 * @return objeto buffer
 */
buffers.prototype.fc6 = function(operacion, posicion, tipo, valor) {
    var bytesDatos = this.dispositivo.tiposMB[tipo].bits / 8;
    var tamBuffer = 5 + bytesDatos / this.dispositivo.bytesPorPosicion;
    var buffer = utilidades.generadorBuffer(this.dispositivo.tiposMB, this.dispositivo.endian, this.dispositivo.noErrores)
        .UINT(operacion)                // ID de la operación
        .UINT(0)                        // ID de protocolo 
        .UINT(tamBuffer)                // Tamaño de buffer
        .BYTE(this.dispositivo.info.id) // ID de la unidad
        .BYTE(6)                        // Función
        .UINT(posicion)                 // Número de referencia
        [tipo](valor)                   // Valor a escribir
        .generar();
    return buffer;
}




/*
 * Buffer de la función FC16
 * 
 * @operacion número de operación
 * @posicion posición en la que escribir el dato
 * @tipo tipo de dato a escribir
 * @valor valor a escribir
 * 
 * @return objeto buffer
 */
buffers.prototype.fc16 = function(operacion, posicion, tipo, valor) {
    var bytesDatos = this.dispositivo.tiposMB[tipo].bits / 8;
    //var tamBuffer = 6 + bytesDatos / this.dispositivo.bytesPorPosicion;   // Descartado por dar error con SENTRON PAC3200 ¿Error general?
    var tamBuffer = 8 + bytesDatos / this.dispositivo.bytesPorPosicion;
    var buffer = utilidades.generadorBuffer(this.dispositivo.tiposMB, this.dispositivo.endian, this.dispositivo.noErrores)
        .UINT(operacion)                                        // ID de la operación
        .UINT(0)                                                // ID de protocolo 
        .UINT(tamBuffer + 1)                                    // Tamaño de buffer
        .BYTE(this.dispositivo.info.id)                         // ID de la unidad
        .BYTE(16)                                               // Función
        .UINT(posicion)                                         // Número de referencia
        .UINT(bytesDatos / this.dispositivo.bytesPorPosicion)   // Cantidad de datos a escribir
        .BYTE(bytesDatos)                                       // Cantidad de bytes a escribir
        [tipo](valor)                                           // Valor a escribir
        .generar();
    return buffer;
}





/*
 * Buffer de la función de control de conexión
 * 
 * @operacion número de operación
 * 
 * @return objeto buffer
 */
buffers.prototype.controlConexion = function(operacion) {
    var buffer = utilidades.generadorBuffer(this.dispositivo.tiposMB, this.dispositivo.endian, this.dispositivo.noErrores)
        .UINT(operacion)                    // ID de la operación
        .UINT(0)                            // ID de protocolo 
        .UINT(6)                            // Tamaño de buffer
        .BYTE(this.dispositivo.info.id)     // ID de la unidad
        .BYTE(8)                            // Operación
        .generar();
    return buffer;
}