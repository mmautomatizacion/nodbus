/* 
 * NodBus por Manuel Martínez Automatización y Pesaje Industrial, S.L.U. se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

/*
 * Función que abrevia la creación de listeners, para crear varios en una sóla función
 * @param listener Object
 * @param accion Object
 * @param callback Function
 */
exports.eventos = function(listener, accion, callback) {
    var evento;
    
    if (typeof accion == "object") {
        for (evento in accion) {
            listener.on(evento, accion[evento]);
        }
    } else if (typeof accion == "string") {
        listener.on(accion, callback);
    }
}


/*
 * Se convierte un objeto en un array
 * @param objeto Object
 * 
 * @return array
 */
exports.obj2arr = function(objeto) {
    var array = new Array();
    var nombreObjeto;
    for (nombreObjeto in objeto) {
        array.push(objeto[nombreObjeto]);
    }
    return array;
}

/**
 * Cambiar la posición del tag definida por el usuario por una definida en un objeto de mapeado
 * @param tags Object
 * @param mapeado Object
 */
exports.mapearTags = function(tags, mapeado) {
    for (var id in tags) {
        var tag = tags[id];
        
        if (typeof mapeado[tag.posicion] === 'number') {
            tag.alias = tag.posicion;
            tag.posicion = mapeado[tag.posicion];
        }
    }
}


/*
 * Se crea un objeto con la información de los Tags que se desean leer
 * @param arrTags Array
 * @param tags Object
 * 
 * @return Object
 */
exports.arrTags2objTags = function(arrTags, tags) {
    var objTags = new Object();
    arrTags.forEach(function(contenidoTag) {
        // Comprobamos si se trata de un tag ya definido, o por el contrario se trata de un nuevo tag (no se añadirá)
        if (typeof contenidoTag == "string") {
            if (typeof tags[contenidoTag] === "undefined") { return; }
            objTags[contenidoTag] = tags[contenidoTag];
        } else {
            var nombreTag;
            for(nombreTag in contenidoTag) {   
                objTags[nombreTag] = contenidoTag[nombreTag];   
            }
        }
    });
    return objTags;
}



/*
 * Obtener un array con los distintos inicio y cantidad de datos a leer para una petición ModBus
 * @param tags Objeto que contiene los tags que se desean leer, con toda su información "tag: {posicion: P, tipo: T}"
 * @param tiposMB Object
 * @param bytesPorPosicion Int
 * @param bytesMaximosPorPeticion Int
 * 
 * @return Object
 */
exports.obtenerRangos = function(tags, tiposMB, bytesPorPosicion, bytesMaximosPorPeticion) {
    /* Ordenamos los Tags para permitir la obtención de los rangos */
    var arrTags = new Array();
    for (var nombreTag in tags) {
        var tag = tags[nombreTag];
        
        arrTags.push({posicion: tag.posicion, nombre: nombreTag, infoTag: tag});
    }
    arrTags.sort(function(a, b) { return a.posicion - b.posicion; });
    
    
    /* Recorremos el array ordenado anterior obteniendo así los distintos rangos sobre los que se realizarán peticiones */    
    var inicio = null;
    var fin = null;    
    var rangos = new Array();
    var tagsRango = new Object();
    var tagPosicionFinal;
    
    arrTags.forEach(function(tag) {
        var infoTag = tag.infoTag;
        
        tagPosicionFinal = infoTag['posicion'] + tiposMB[infoTag['tipo']].bits / 8 / bytesPorPosicion;
        if (inicio === null) {
            inicio = infoTag['posicion'];
        }
        
        if ((tagPosicionFinal - inicio) <= parseInt(bytesMaximosPorPeticion / bytesPorPosicion)) {
            fin = tagPosicionFinal;
        } else {
            rangos.push({tags: tagsRango, inicio: inicio, cantidad: (fin - inicio)});
            
            inicio = infoTag['posicion'];
            fin = tagPosicionFinal;
            tagsRango = new Object();   
        }
        tagsRango[tag.nombre] = infoTag;
    });
    rangos.push({tags: tagsRango, inicio: inicio, cantidad: (fin - inicio)});
    
    return rangos;
}


/*
 * Extraemos los datos de un buffer determinado a partir de sus tags
 * @param buffer Objeto relativo a BufferExtraer
 * @param tags Object
 * 
 * @return Object
 */
exports.extraerTags = function(buffer, tags) {
    var datos = new Object;
    var nombreTag;
    var tag;
    for (nombreTag in tags) {
        tag = tags[nombreTag];
        datos[nombreTag] = buffer[tag.tipo](tag.posicion);
    }
    return datos;
}

/*
 * Mezcla directa del contenido del primer objeto con el del segundo objeto. En caso de coincidencia, prevalecen los del primer objeto
 * @param objeto1 Object
 * @param objeto2 Object
 */
exports.mezclarObjetos = function(objeto1, objeto2) {
    var nombreObjeto;
    for (nombreObjeto in objeto1) {
        objeto2[nombreObjeto] = objeto1[nombreObjeto];
    }
}

exports.generadorBuffer = require('./utilidades/generadorBuffer');
exports.extractorBuffer = require('./utilidades/extractorBuffer');