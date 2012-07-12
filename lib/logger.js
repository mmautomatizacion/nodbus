/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
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
    this.dispositivo = dispositivo
    
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