/* 
 * NodBus por Manuel Martínez Automatización y Pesaje Industrial, S.L.U. se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var conexion = require('./../../conexion');
var utilidades = require('./../../utilidades');
var buffers = require('./buffers');

/*
 * Constructor del driver
 */
var driver = function(dispositivo) {
    dispositivo.info.id = 1;
    dispositivo.info.ip = 'localhost';
    dispositivo.info.puerto = 502;
    dispositivo.endian = 'BE';    // Se ajusta si será LittleEndian (LE) o BigEndian (BE)
    dispositivo.bytesPorPosicion = 2;  // Establece cuantos bytes abarca una posición del dispositivo
    dispositivo.estructuraCabecera = {
        operacion: 'UINT',
        protocolo: 'UINT',
        bytes: 'UINT',
        unidad: 'BYTE',
        funcion: 'BYTE'
    }
    
    
    /*
    * Conecta con el dispositivo
    */
    dispositivo.conectar = function() {
        if (typeof this.socket !== 'undefined') {
            this.socket.end();
            this.socket.destroy();
            delete this.socket;
        }

        this.socket = conexion.TCP(this.info.ip, this.info.puerto);

        var _self = this;
        utilidades.eventos(this.socket, {
            connect: function() {
                _self.emit("conexion");
            },
            error: function(err) {
                _self.emit("error", err);
            },
            close: function() {
                _self.emit("desconexion");
            },
            data: function(data) {
                _self.emit("datosRecibidos", data);
            }
        });
    };
    
    
    /*
    * Envía el buffer de petición de datos
    * 
    * @buffer objeto buffer a enviar
    */
    dispositivo.enviarPeticion = function(buffer) {
        if (this.socket.write(buffer)) {
            return true;
        } else {
            return false;
        }
    }
    
    
    dispositivo.buffers = new buffers(dispositivo);
}

module.exports = exports = driver;