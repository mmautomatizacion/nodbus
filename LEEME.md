# Información Inicial #

NodBus es un Controlador del Protocolo Modbus escrito 100% en JavaScript para Node.JS
> NodBus by Manuel Martínez Automatización y Pesaje Industrial, S.L.U. is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

---------------------

# Primeros pasos #

## Instalación ##
Una vez tengamos instalados Node.JS y NPM, escribir en la consola del sistema lo siguiente:

    npm install nodbus



## Declarando un dispositivo ModBus TCP simple ##

    var nodbus = require("nodbus");

    dispositivo = new nodbus("NombreDispositivo", "TCP", {
      ip: '192.168.1.20',
      puerto: 502,
      tags: {
        NombreTag: {posicion: 602, tipo: 'FLOAT'},
        NombreTag2: {posicion: 604, tipo: 'DINT'}
      }
    });

## leer Tags ##

    dispositivo.fc3({'NombreTag', 'NombreTag2'}, function(datos) {
      // Tags leídos correctamente.
      console.log(datos);
    });

## Escribiendo Tag ##

    dispositivo.fc16('NombreTag', 452, function() {
      // Tag escrito correctamente.
    });

## Iniciar servidor NodBus ##
En la consola, sitúate en el directorio del fichero JavaScript creado, y escribe:

    node nodBusServer.js

---------------------

# Configuración Avanzada #

## Parámetros del dispositivo ##
Para cada dispositivo podemos configurar una serie de parámetros. Por ejemplo, esta es una definición completa del protocolo ModBus TCP:

    dispositivo = new nodbus("NombreDispositivo", "TCP", {
      id: 1,
      ip: '192.168.1.20',
      puerto: 502,
      endian: 'LE',
      bytesPorPosicion: 2,      
      tags: {
        NombreTag: {posicion: 602, tipo: 'FLOAT'},
        NombreTag: {posicion: 604, tipo: 'DINT'}
      }
    });

*id* es el identificador del dispositivo. Este es configurado en el propio dispositivo  
*ip* es la dirección IP  
*puerto* es el puerto. 502 por defecto  
*endian* puede ser definido como BE (Big Endian), LE (Little Endian), BEW (Big Endian by Word) o LEW (Little Endian by Word)  
*bytesPorPosicion* establece la cantidad de bytes contenidos en una sóla posición del dispositivo  
*tags* configura las posiciones y tipos de datos del dispositivo  

## Tipos de datos ##
- **BYTE** 8 bits
- **INT** Entero con signo de 16 bits
- **UINT** Entero sin signo de 16 bits
- **DINT** Entero con signo de 32 bits
- **UDINT** Entero sin signo de 32 bits
- **FLOAT** Número con coma flotante de 32 bits
- **DOUBLE** Número con coma flotante de 64 bits

## Alias ##
Por comodidad, he creado algunos alias que referencian a los números de funciones:
- **dispositivo.leer** FC3
- **dispositivo.leerTodo** FC3 para todos los tags definidos
- **dispositivo.escribirPalabra** FC6
- **dispositivo.escribir** FC16 limitado a una sóla posición