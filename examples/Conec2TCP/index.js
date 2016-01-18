var nodbus = require("nodbus");


/*******************************************************
 * 
 *  CONFIGURATION PARAMETERS
 * 
 ******************************************************/
var name = "Device";
var driver = 'TCP';
var tags = {
    Tag1: {posicion: 1, tipo: "FLOAT"},
    Tag2: {posicion: 517, tipo: "UINT"},
    Tag3: {posicion: 801, tipo: 'DOUBLE'},
}
var info = {
    ip: '192.168.1.11'
};



/*******************************************************
 * 
 *  CONNECTION
 * 
 ******************************************************/
var device = new nodbus(name, driver, tags, info);

// On Connected...
device.on("connected", function() {
    console.log("Device connected");

    this.readMultipleRegisters(function(data) {
        console.log(data);
    });
});