# NodBus #

Slave Controller for ModBus TCP Protocol. Written for Node.JS in full JavaScript

---------------------


# First steps #

## Instalation ##
Once we have installed Node.JS and NPM, write in console the next command:

```bash
npm install nodbus
```



## Declaring a simple ModBus TCP device ##
To start reading or writing data with NodBus just have to create a "nodbus" object for each ModBus Master that we want to connect. This example show how to connect to a ModBus master with IP 192.168.1.20, declaring two tags for read and write.

```js
var nodbus = require("nodbus");

device = new nodbus("NameOfDevice", "TCP", {
  ip: '192.168.1.20',
  puerto: 502,
  tags: {
    TagName: {posicion: 602, tipo: 'FLOAT'},
    TagName2: {posicion: 604, tipo: 'DINT'}
  }
});
```

## Read tags ##
For read tags, have to execute the corresponding function and define what tags want to read. In the example we read two tags through FC3 function (ReadMultipleRegisters). These tags were defined previously.

```js
device.readMultipleRegisters({'TagName', 'TagName'}, function(data) {
  // Tags read correctly.
  console.log(data);
});
```

Or we can read all the tags defined:
```js
device.readMultipleRegisters(function(data) {
  // Tags read correctly.
  console.log(data);
});


## Writing tags ##
For writing tags, we have to execute the corresponding function. In this example, we use the function FC16 (WriteMultipleRegister) to write 452 in "TagName" tag.

```js
device.writeMultipleRegisters('TagName', 452, function() {
  // Tag written correctly.
});
```

---------------------

# Advanced configuration #

## Device parameters ##
For each device we can configure a lot of optional parameters. For example, this is the complete defition for ModBus TCP protocol:

```js
device = new nodbus("DeviceName", "TCP", {
  id: 1,
  ip: '192.168.1.20',
  puerto: 502,
  endian: 'LE',
  bytesPorPosicion: 2,
  tags: {
    TagName: {posicion: 602, tipo: 'FLOAT'},
    TagName2: {posicion: 604, tipo: 'DINT'}
  }
});
```

*id* is the ID of the device. This is configured in the device 
*ip* is the IP direction 
*puerto* is the port
*endian* can be defined like BE (Big Endian), LE (Little Endian), BEW (Big Endian by Word) or LEW (Little Endian by Word)  
*bytesPorPosicion* define the amount of bytes for one position in the master device
*tags* configure position and data type for each tag in the device

## Data types ##
- **BYTE** 8 bits
- **INT** Signed Integer of 16 bits
- **UINT** Unsigned Integer of 16 bits
- **DINT** Signed Integer of 32 bits
- **UDINT** Unsigned Integer of 32 bits
- **FLOAT** Floating Point number of 32 bits
- **DOUBLE** Floating Point number of 64 bits

## Alias ##
- **dispositivo.readMultipleRegisters** FC3
- **dispositivo.writeSingleRegisters** FC6
- **dispositivo.writeMultipleRegisters** FC16 (limited to one register)