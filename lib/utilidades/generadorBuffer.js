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

var utilidades = require('./../utilidades');

/*
 *  Constructor
 *  @tiposMB objeto con los tipos de datos de ModBus
 *  @endian tipo de endian del dispositivo
 */
var generadorBuffer = function(tiposMB, endian, noErrores) {
    if (!(this instanceof generadorBuffer)) return new generadorBuffer(tiposMB, endian, noErrores);
    this.bytesBuffer = 0;
    this.buff = new Array;
    this.tiposMB = tiposMB;
    this.endian = endian;
    this.noErrores = noErrores;
    
    /*
     * Creación de las funciones específicas para cada tipo de dato
     */
    
    // Obtenemos un array con los tipos de datos de ModBus
    var arrTipos = new Array;
    var tipo;
    for (tipo in this.tiposMB) {
        arrTipos.push(tipo);
    }  

    // Creamos las funciones correspondientes para cada tipo de dato, de forma que conviertan los bytes del buffer en el tipo numérico adecuado
    arrTipos.forEach((function (nombreTipo) {
        generadorBuffer.prototype[nombreTipo] = function(dato) {
            return this.agregarDato(nombreTipo, dato);
        }
    }).bind(this));
    
    return true; // Devuelve algo para evitar errores en la comprobación de código
}
module.exports = exports = generadorBuffer;


/*
 * Agregar cada uno de los datos con los que contará el buffer
 * 
 * @nombreTipo texto
 * @valor número
 * 
 * @return objeto cola
 */
generadorBuffer.prototype.agregarDato = function(nombreTipo, valor) {
    var tipo = this.tiposMB[nombreTipo];
    var bytes = tipo['bits'] / 8;
    this.bytesBuffer += bytes;
    this.buff.push({tipo: nombreTipo, bytes: bytes, valor: valor});

    return this;
}


/*
 * Generar el buffer creado anteriormente
 * 
 * @return buffer
 */
generadorBuffer.prototype.generar = function() {
    var _self = this;
    // Se crea el buffer vacío, utilizando la cantidad de bytes que han sido precalculados
    var bufferGenerado = new Buffer(this.bytesBuffer);
    var offset = 0;
    
    // Se recorre cada uno de los elementos a añadir al buffer y se añaden, acorde al tipo de dato
    this.buff.forEach(function(elemento) {
        var tipo = _self.tiposMB[elemento['tipo']];

        var funcion = "write"+tipo['funcion'];
        if (tipo['endian']) {
            funcion += _self.endian.toUpperCase();
        }
        bufferGenerado[funcion](elemento['valor'], offset, _self.noErrores);

        offset += elemento['bytes'];
    });
    
    // Se devuelve el objeto tipo buffer creado
    return bufferGenerado;
}