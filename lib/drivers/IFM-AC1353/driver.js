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
    * Se obtienen las posiciones del dispositivo actual respecto a su identificador
    */
    dispositivo.mapeado = new Object();
    
    var contQ = 12351, contI = 12287;
    for (var i = 0; i <= 63; i++) {
        dispositivo.mapeado["%QW0."+i] = contQ; contQ++;
        dispositivo.mapeado["%IW0."+i] = contI; contI++;
    }

    contI = contQ;
    contQ = contI+256;
    for (var i = 0; i <= 255; i++) {
        dispositivo.mapeado["%QW4."+i] = contQ; contQ++;
        dispositivo.mapeado["%IW4."+i] = contI; contI++;
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