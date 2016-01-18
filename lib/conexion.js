/*
*	Nodbus. Slave Controller for ModBus TCP protocol in Node.JS 
*	Copyright (C) 2016 Manuel Martínez Automatización y Pesaje Industrial, S.L.U.
*
*	This program is free software: you can redistribute it and/or modify
*	it under the terms of the GNU General Public License as published by
*	the Free Software Foundation, either version 3 of the License, or
*	(at your option) any later version.
*
*	This program is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU General Public License for more details.
*
*	You should have received a copy of the GNU General Public License
*	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var net = require('net');

exports.TCP = function(ip, puerto) {
    var conexion = net.connect(puerto, ip);
    return conexion;
}

/*exports.UDP = function() {
    
}

exports.Serial = function() {
    
}*/