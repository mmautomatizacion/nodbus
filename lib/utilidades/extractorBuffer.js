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

/*
 * Constructor
 * 
 * @buff objeto tipo buffer a tratar
 * @estructuraCabecera objeto que incluye las reglas para extraer correctamente la cabecera de cada trama recibida
 * @tiposMB objeto que contiene los tipos de datos de ModBus
 * @bytesPorPosicion cantidad de bytes respecto a cada posición del dispositivo
 * @endian método de conversión de datos del dispositivo.
 */
var extractorBuffer = function(buff, estructuraCabecera, tiposMB, bytesPorPosicion, endian, noErrores) {
    if (!(this instanceof extractorBuffer)) return new extractorBuffer(buff, estructuraCabecera, tiposMB, bytesPorPosicion, endian, noErrores);
    var longitudCabecera = 0;
    this.posicionInicial = 1;
    
    // Extraemos los datos de la cabecera
    if (typeof estructuraCabecera !== 'undefined') {
        var posActual = 0;
        for (var idCabecera in estructuraCabecera) {
            var tipo = tiposMB[estructuraCabecera[idCabecera]];
            
            var func = 'read'+tipo['funcion'];
            if (tipo['endian']) {
                func += endian;
            }
            this[idCabecera] = buff[func](posActual, noErrores);
            
            posActual += tipo['bits'] / 8;
        }
        
        longitudCabecera = posActual+1;
    }
    
    
    // Obtenemos la parte de contenido
    this.buffer = buff.slice(longitudCabecera);
    
    
    // Obtenemos un array con los tipos de datos de ModBus
    var arrTipos = new Array;
    for (tipo in tiposMB) {
        arrTipos.push(tipo);
    }
    
    // Creamos las funciones correspondientes para cada tipo de dato, de forma que conviertan los bytes del buffer en el tipo numérico adecuado
    arrTipos.forEach((function (nombreTipo) {
        this[nombreTipo] = function(posicion) {
            posicion = (posicion - this.posicionInicial) + 1;
            tipo = tiposMB[nombreTipo];
            
            func = 'read'+tipo['funcion'];
            if (tipo.endian) {
                func += endian;
            }
            var pos = posicion * bytesPorPosicion - bytesPorPosicion;
            return this.buffer[func](pos, noErrores);
        }
    }).bind(this));
    
    return this;
}
module.exports = exports = extractorBuffer;