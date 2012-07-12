/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 *
 * @description Genera el buffer necesario para realizar una petición
 */

var utilidades = require('./../utilidades');

var buffer = function(tiposMB, endian) {
    if (!(this instanceof buffer)) return new buffer(tiposMB, endian);
    this.bytesBuffer = 0;
    this.buff = new Array;
    this.tiposMB = tiposMB;
    this.endian = endian;
    
    /*
     * Creación de las funciones específicas para cada tipo de dato
     */
    
    // Obtenemos un array con los tipos de datos de ModBus
    arrTipos = new Array;
    for (tipo in this.tiposMB) {
        arrTipos.push(tipo);
    }  

    // Creamos las funciones correspondientes para cada tipo de dato, de forma que conviertan los bytes del buffer en el tipo numérico adecuado
    arrTipos.forEach((function (nombreTipo) {
        buffer.prototype[nombreTipo] = function(dato) {
            return this.agregarDato(nombreTipo, dato);
        }
    }).bind(this));
    
    return true; // Devuelve algo para evitar errores en la comprobación de código
}

/*
 * Agregar cada uno de los datos con los que contará el buffer
 */
buffer.prototype.agregarDato = function(nombreTipo, valor) {
    tipo = this.tiposMB[nombreTipo];
    bytes = tipo['bits'] / 8;
    this.bytesBuffer += bytes;
    this.buff.push({tipo: nombreTipo, bytes: bytes, valor: valor});

    return this;
}

/*
 * Generar el buffer creado anteriormente
 */
buffer.prototype.generar = function() {
    var bufferGenerado = new Buffer(this.bytesBuffer);
    var offset = 0;
    for (e in this.buff) {
        elemento = this.buff[e];
        tipo = this.tiposMB[elemento['tipo']];

        funcion = "write"+tipo['funcion'];
        if (tipo['endian']) {
            funcion += this.endian.toUpperCase();
        }
        bufferGenerado[funcion](elemento['valor'], offset);

        offset += elemento['bytes'];
    }
    
    return bufferGenerado;
}

module.exports = exports = buffer;