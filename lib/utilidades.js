/* 
 * MM SoftGestion por Luis Gómez se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */


/**
 * Función de escucha de eventos
 * 
 * @accion String o Object
 */
exports.eventos = function(listener, accion, callback) {
    if (typeof accion == "object") {
        for (evento in accion) {
            listener.on(evento, accion[evento]);
        }
    } else if (typeof accion == "string") {
        listener.on(accion, callback);
    }
}

/**
 * Se crea un objeto con la información de los Tags que se desean leer
 * 
 * @arrTags array
 */
exports.arrTags2objTags = function(arrTags) {
    objTags = new Object();
    for (t in arrTags) {
        nombreTag = arrTags[t];

        objTags[nombreTag] = dispositivo.tags[nombreTag];
    }
    return objTags;
}



/**
 * Obtener un array con los distintos inicio y cantidad de datos a leer para una petición ModBus
 * @tags Objeto que contiene los tags que se desean leer, con toda su información "tag: {posicion: P, tipo: T}"
 * @bytesMaximosPorPeticion int
 */
exports.obtenerRangos = function(tags, bytesMaximosPorPeticion) {
    inicio = null;
    fin = null;    
    rangos = new Array();
    tagsRango = new Object();
    
    for (nombreTag in tags) {
        tag = tags[nombreTag];
        tagPosicionFinal = tag['posicion'] + dispositivo.tiposMB[tag['tipo']].bits / 8 / dispositivo.bytesPorPosicion;
        if (inicio === null) {
            inicio = tag['posicion'];
        }
        
        if ((tagPosicionFinal - inicio) <= parseInt(bytesMaximosPorPeticion / dispositivo.bytesPorPosicion)) {
            fin = tagPosicionFinal;
        } else {
            rangos.push({tags: tagsRango, inicio: inicio, cantidad: (fin - inicio)});
            
            inicio = tag['posicion'];
            fin = tagPosicionFinal;
            tagsRango = new Object();   
        }
        tagsRango[nombreTag] = tag;
    }
    rangos.push({tags: tagsRango, inicio: inicio, cantidad: (fin - inicio)});

    return rangos;
}


/**
 * Extraemos los datos de un buffer determinado a partir de sus tags
 * @buffer Objeto relativo a BufferExtraer
 * @tags Objeto
 */
exports.extraerTags = function(buffer, tags) {
    datos = new Object;
    for (nombreTag in tags) {
        tag = tags[nombreTag];
        datos[nombreTag] = buffer[tag.tipo](tag.posicion);
    }
    return datos;
}

exports.buffer = require('./utilidades/buffer');
exports.bufferExtraer = require('./utilidades/bufferExtraer');