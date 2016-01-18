# NodBus #

Controlador esclavo del protocolo Modbus TCP escrito 100% en JavaScript para Node.JS.

---------------------


# Primeros pasos #

## Instalación ##
Una vez tengamos instalados Node.JS y NPM, deberemos escribir en la consola del sistema lo siguiente:

```bash
npm install nodbus
```



## Declarando un dispositivo ModBus TCP simple ##
Para comenzar a leer o escribir datos con Nodbus tan sólo deberemos crear un objeto "nodbus" por cada maestro ModBus al que queramos conectarnos. Este ejemplo muestra como conectarse a un maestro ModBus situado en la IP 192.168.1.20, definiendo además dos tags del dispositivo que utilizaremos posteriormente para realizar las lecturas y escrituras.

```js
var nodbus = require("nodbus");

dispositivo = new nodbus("NombreDispositivo", "TCP", {
  ip: '192.168.1.20',
  puerto: 502,
  tags: {
    NombreTag: {posicion: 602, tipo: 'FLOAT'},
    NombreTag2: {posicion: 604, tipo: 'DINT'}
  }
});
```

## Leer tags ##
Para leer tags, tan sólo tendremos que ejecutar la función correspondiente y definirle qué tags queremos leer. En el ejemplo siguiente leemos a través de la funcion FC3 (ReadMultipleRegisters) los dos tags que hemos definido al crear el esclavo.

```js
dispositivo.leerMultiplesRegistros({'NombreTag', 'NombreTag2'}, function(datos) {
  // Tags leídos correctamente.
  console.log(datos);
});
```

O podemos leer todos los tags definidos:
```js
dispositivo.leerMultiplesRegistros(function(datos) {
  // Todos los tags leídos correctamente.
  console.log(datos);
});
```


## Escribiendo Tag ##
Para escribir tags, ejecutaremos la función que se encarga de ello, definiendo el valor que queremos escribir. En el ejemplo siguiente utilizaremos la función FC16 para escribir el valor 452 al tag llamado "NombreTag".

```js
dispositivo.escribirMultiplesRegistros('NombreTag', 452, function() {
  // Tag escrito correctamente.
});
```

---------------------

# Configuración Avanzada #

## Parámetros del dispositivo ##
Para cada dispositivo podemos configurar una serie de parámetros. Por ejemplo, esta es una definición completa del protocolo ModBus TCP:

```js
dispositivo = new nodbus("NombreDispositivo", "TCP", {
  id: 1,
  ip: '192.168.1.20',
  puerto: 502,
  endian: 'LE',
  bytesPorPosicion: 2,
  tags: {
    NombreTag: {posicion: 602, tipo: 'FLOAT'},
    NombreTag2: {posicion: 604, tipo: 'DINT'}
  }
});
```

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
Por comodidad, se han creado algunos álias que referencian a los números de funciones:
- **dispositivo.leerMultiplesRegistros** FC3
- **dispositivo.escribirRegistro** FC6
- **dispositivo.escribirMultiplesRegistros** FC16 (limitado a un sólo registro)