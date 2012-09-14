/* 
 * NodBus por Manuel Martínez Automatización y Pesaje Industrial, S.L.U. se encuentra bajo una Licencia Creative Commons
 * No se permite un uso comercial de la obra original ni la generación de obras derivadas.
 */

var util = require("util");


/*
 * Función que abrevia la creación de listeners, para crear varios en una sóla función
 * 
 * @accion String o Object
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
 * 
 * @objeto objeto
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


/*
 * Se crea un objeto con la información de los Tags que se desean leer
 * 
 * @arrTags array
 * @tags object
 * 
 * @return objeto contenedor de los tags
 */
exports.arrTags2objTags = function(arrTags, tags) {
    if (!util.isArray(arrTags)) { arrTags = [arrTags]; }
    var objTags = new Object();
    var id;
    for (id in arrTags) {
        var contenidoTag = arrTags[id];
        
        // Comprobamos si se trata de un tag ya definido, o por el contrario se trata de un nuevo tag (no se añadirá)
        if (typeof contenidoTag == "string") {
            objTags[contenidoTag] = tags[contenidoTag];
        } else {
            var nombreTag;
            for(nombreTag in contenidoTag) {   
                objTags[nombreTag] = contenidoTag[nombreTag];   
            }
        }
    }
    return objTags;
}



/*
 * Obtener un array con los distintos inicio y cantidad de datos a leer para una petición ModBus
 * 
 * @tags Objeto que contiene los tags que se desean leer, con toda su información "tag: {posicion: P, tipo: T}"
 * @bytesMaximosPorPeticion int
 * 
 * @return objeto con todos los rangos
 */
exports.obtenerRangos = function(tags, tiposMB, bytesPorPosicion, bytesMaximosPorPeticion) {
    var inicio = null;
    var fin = null;    
    var rangos = new Array();
    var tagsRango = new Object();
    var nombreTag;
    var tag;
    var tagPosicionFinal;
    
    for (nombreTag in tags) {
        tag = tags[nombreTag];
        tagPosicionFinal = tag['posicion'] + tiposMB[tag['tipo']].bits / 8 / bytesPorPosicion;
        if (inicio === null) {
            inicio = tag['posicion'];
        }
        
        if ((tagPosicionFinal - inicio) <= parseInt(bytesMaximosPorPeticion / bytesPorPosicion)) {
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


/*
 * Extraemos los datos de un buffer determinado a partir de sus tags
 * 
 * @buffer Objeto relativo a BufferExtraer
 * @tags Objeto
 * 
 * @return objeto contenedor de los datos
 */
exports.extraerTags = function(buffer, tags) {
    var datos = new Object;
    var nombreTag;
    for (nombreTag in tags) {
        tag = tags[nombreTag];
        datos[nombreTag] = buffer[tag.tipo](tag.posicion);
    }
    return datos;
}

/*
 * Mezcla directa del contenido del primer objeto con el del segundo objeto. En caso de coincidencia, prevalecen los del primer objeto
 * 
 * @objeto1 objeto
 * @objeto2 objeto
 */
exports.mezclarObjetos = function(objeto1, objeto2) {
    var nombreObjeto;
    for (nombreObjeto in objeto1) {
        objeto2[nombreObjeto] = objeto1[nombreObjeto];
    }
}

exports.generadorBuffer = require('./utilidades/generadorBuffer');
exports.extractorBuffer = require('./utilidades/extractorBuffer');