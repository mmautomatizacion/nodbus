/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 * 
 * @description Permite convertir el contenido del buffer a su dato real
 */


var bufferExtraer = function(buff, estructuraCabecera, tiposMB, bytesPorPosicion, endian) {
    if (!(this instanceof bufferExtraer)) return new bufferExtraer(buff, estructuraCabecera, tiposMB, bytesPorPosicion, endian);
    var longitudCabecera = 0;
    this.posicionInicial = 1;
    
    // Extraemos los datos de la cabecera
    if (typeof estructuraCabecera !== 'undefined') {
        posActual = 0;
        for (idCabecera in estructuraCabecera) {
            tipo = tiposMB[estructuraCabecera[idCabecera]];
            
            func = 'read'+tipo['funcion'];
            if (tipo['endian']) {
                func += endian;
            }
            this[idCabecera] = buff[func](posActual);
            
            posActual += tipo['bits'] / 8;
        }
        
        longitudCabecera = posActual+1;
    }
    
    
    // Obtenemos la parte de contenido
    this.buffer = buff.slice(longitudCabecera);
    
    
    // Obtenemos un array con los tipos de datos de ModBus
    arrTipos = new Array;
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
            pos = posicion * bytesPorPosicion - bytesPorPosicion;
            return this.buffer[func](pos);
        }
    }).bind(this));
    
    return this;
}

module.exports = exports = bufferExtraer;