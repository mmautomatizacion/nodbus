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

var util = require('util');
var tty = require('tty');
var colores = tty.isatty(process.stdout.fd); // Detecta si nos encontramos en la terminal o guardando en un fichero. Si se trata de terminal, se aplicarán colores.
var colorDefecto = 39;
var colorExtra = 36;
var tiposMensaje = {
    "error": {"color": 31},
    "aviso": {"color": 33},
    "info": {"color": 32}
}



/*
 * Constructor
 * 
 * @dispositivo nombre del dispositivo
 */
var logger = function(dispositivo) {
    this.dispositivo = dispositivo;
    
    // Del objeto "tiposMensaje" se crea un array sólo con los nombres de estos. Será utilizado posteriormente.
    var arrTipos = new Array();
    for (var tipo in tiposMensaje) {
        arrTipos.push(tipo);
    }
    
    
    // Se crea una función para cada tipo de error, de forma que este objeto pueda ser llamado de forma "logger.tipo". Cada tipo de error conlleva un color para el mensaje a mostrar.
    arrTipos.forEach((function (nombreTipo) {
        this[nombreTipo] = function(mensaje) {
            var tipo = tiposMensaje[nombreTipo];
            
            var log = "";
            if (colores) {
                log += "[ ";
                log += "\033["+colorExtra+"m";
                log += this.dispositivo;
                log += "\033["+colorDefecto+"m";
                log += " ] ";
                log += "\033["+tipo.color+"m";
                log += mensaje;
                log += "\033["+colorDefecto+"m";
            } else {
                log = "[ "+this.dispositivo+" ] "+mensaje;
            }
            
            util.log(log);
        }
    }).bind(this));
    
    return this;
}
module.exports = exports = logger;