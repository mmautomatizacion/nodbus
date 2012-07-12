/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var conexion = require('./../conexion');
var utilidades = require('./../utilidades');

/*
 * Constructor del driver
 */
var driver = function() {
    this.id = 1;
    this.ip = 'localhost';
    this.puerto = 502;
    this.endian = 'BE';    // Se ajusta si será LittleEndian (LE) o BigEndian (BE)
    this.bytesPorPosicion = 2;  // Establece cuantos bytes abarca una posición del dispositivo
    this.estructuraCabecera = {
        operacion: 'INT',
        protocolo: 'INT',
        bytes: 'INT',
        unidad: 'BYTE',
        funcion: 'BYTE'
    }
}

/*
 * Conecta con el dispositivo
 */
driver.prototype.conectar = function() {
    if (typeof this.socket !== 'undefined') {
        this.socket.destroy();
        delete this.socket;
    }
    
    this.socket = conexion.TCP(this.ip, this.puerto);
    
    var _self = this;
    utilidades.eventos(this.socket, {
        connect: function() {
            _self.emit("conexion");
        },
        timeout: function() {
            _self.emit("desconexion");
        },
        error: function(err) {
            _self.emit("error", err);
        },
        data: function(data) {
            _self.emit("datosRecibidos", data);
        }
    });
}

/*
 * Envía el buffer de petición de datos
 * 
 * @buffer objeto buffer a enviar
 */
driver.prototype.enviarPeticion = function(buffer) {
    if (this.socket.write(buffer)) {
        return true;
    } else {
        return false;
    }
}

/*
 * Realiza la petición de datos según la posicion
 * 
 * @operacion operación asignada
 * @posicionInicial posición del dispositivo en la que comienza la lectura
 * @cantidad cantidad de datos a leer
 */
driver.prototype.generarBufferLectura = function(operacion, posicionInicial, cantidad) {    
    var buffer = utilidades.buffer(this.tiposMB, this.endian)
        .INT(operacion)             // ID de la operación
        .INT(0)                     // ID de protocolo 
        .INT(6)                     // Tamaño de buffer
        .BYTE(this.id)              // ID de la unidad
        .BYTE(3)                    // Operación
        .INT(posicionInicial)       // Número de referencia
        .INT(cantidad)              // Cantidad de datos a leer
        .generar();
    return buffer;
}

/*
 * Genera el buffer que realizará la consulta para comprobar que el dispositivo está actualmente disponible
 * 
 * @operacion número de operación a asignar
 */
driver.prototype.generarBufferComprobacion = function(operacion) {
    var buffer = utilidades.buffer(this.tiposMB, this.endian)
        .INT(operacion)             // ID de la operación
        .INT(0)                     // ID de protocolo 
        .INT(6)                     // Tamaño de buffer
        .BYTE(this.id)              // ID de la unidad
        .BYTE(8)                    // Operación
        .generar();
    return buffer;
}


module.exports = exports = driver;