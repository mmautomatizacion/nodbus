# Summary #

NodBus is a ModBus Protocol Controller written 100% in Node.JS JavaScript
> NodBus by Manuel Martínez Automatización y Pesaje Industrial, S.L.U. is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

---------------------

# First steps #

## Installation ##
Once Node.JS and NPM are installed on your system, go console and write:

    npm install nodbus



## Declaring a simple ModBus TCP Device ##

    var nodbus = require("nodbus");

    device = new nodbus("DeviceName", "TCP", {
      ip: '192.168.1.20',
      puerto: 502,
      tags: {
        TagName: {posicion: 602, tipo: 'FLOAT'},
        TagName2: {posicion: 604, tipo: 'DINT'}
      }
    });

## Reading Tags ##

    device.fc3({'TagName', 'TagName2'}, function(data) {
      // Tags readed correctly.
      console.log(data);
    });

## Writting Tag ##

    device.fc16('TagName', 452, function() {
      // Tag writted correctly.
    });

## Run NodBus Server ##
In console, go to the directory of the JavaScript file, and write:

    node nodBusServer.js

---------------------

# Advanced Configuration #

## Device Parameters ##
There are multiple configuration parameters for each device. This is a complete configuration of a ModBus TCP device:

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

*id* is the identifier of the device. It's configured in the device  
*ip* is the ip address  
*puerto* is the port. 502 by default  
*endian* can be set to BE (Big Endian), LE (Little Endian), BEW (Big Endian by Word) and LEW (Little Endian by Word)  
*bytesPorPosicion* set the bytes that need one position of the device  
*tags* configure the positions and type in the device  

## Data Types ##
- **BYTE** 8 bits
- **INT** Signed Integer of 16 bits
- **UINT** Unsigned Integer of 16 bits
- **DINT** Signed Integer of 32 bits
- **UDINT** Unsigned Integer of 32 bits
- **FLOAT** Floating Point number of 32 bits
- **DOUBLE** Floating Point number of 64 bits

## Aliases ##
For convenience, I've created some aliases that reference to functions:
- **device.read** FC3
- **device.readAll** FC3 for all the tags defined
- **devide.writeWord** FC6
- **device.write** FC16 but limited to one position


---------------------

> Bear in mind that the controller is programmed in spanish. Because of this, all the comments and logs are written in that language.