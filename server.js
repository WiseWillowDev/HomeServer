const httpServer = require('http').createServer();

const { Server } = require("socket.io");

const PORT = 3001

const CAN_LOG = true;

function log(message) {
    if (CAN_LOG) {
        console.log(message)
    }
}

const lights_config = [
    {
        ipAddress: '192.168.1.176',
        socketId: null,
        buttons: [
            {
                pin: 16,
                servoUrl: "some url",
                info: {
                    servoIp: '192.168.1.176',
                    servoPin: 14
                }
            }
        ],
        servos: [
            {
                displayName: "BathRoom light",
                isOff: false,
                pin: 14,
                valueOff: 1550, //500
                valueOn: 800, //2500  
            }               
        ]
    },
    {
        ipAddress: '192.168.1.186',
        socketId: null,
        buttons: [
            {
                pin: 21,
                servoUrl: "",
                info: {
                    servoIp: '192.168.1.186',
                    servoPin: 14
                }
            },
            {
                pin: 23,
                servoUrl: "",
                info: {
                    servoIp: '192.168.1.186',
                    servoPin: 4
                }
            }
        ],
        servos: [
            {
                displayName: "Bed Room light",
                isOff: false,
                pin: 14,
                valueOff: 1750, //500
                valueOn: 1050, //2500  
            },
            {
                displayName: "Bed Room fan",
                isOff: false,
                pin: 4,
                valueOff: 1750, //500
                valueOn: 1000, //2500  
            }    
        ]
    },
    {
        ipAddress: '192.168.1.171',
        socketId: null,
        buttons: [
            {
                pin: 27,
                servoUrl: "",
                info: {
                    servoIp: '192.168.1.171',
                    servoPin: 17
                }
            },
            {
                pin: 21,
                servoUrl: "",
                info: {
                    servoIp: '192.168.1.171',
                    servoPin: 14
                }
            }
        ],
        servos: [
            {
                displayName: "Kitchen Light",
                isOff: false,
                pin: 17,
                valueOff: 1700, //500
                valueOn: 875, //2500  
            },
            {
                displayName: "Living Room Light",
                isOff: false,
                pin: 14,
                valueOff: 1650, //500
                valueOn: 900, //2500  
            }    
        ]
    },
    {
        ipAddress: '192.168.1.213',
        socketId: null,
        buttons: [
            {
                pin: 27,
                servoUrl: "",
                info: {
                    servoIp: '192.168.1.171',
                    servoPin: 17
                }
            },
            {
                pin: 21,
                servoUrl: "",
                info: {
                    servoIp: '192.168.1.213',
                    servoPin: 14
                }
            }
        ],
        servos: [
            {
                displayName: "Counter Light",
                isOff: false,
                pin: 14,
                valueOff: 1800, //500
                valueOn: 1000, //2500  
            }  
        ]
    },
]

let connected_lights = []

function update_lights() {
    let lightsDto = [];
    connected_lights.forEach(light => {
        light.servos.forEach(servo => {
            lightsDto.push({
                name: servo.displayName,
                isOff: servo.isOff
            })
        })
    })
    return lightsDto;
}

const io = new Server(httpServer);

io.on('connection', (socket) => {

    const socketIp = socket.request._query.ipAddress;

    if (socketIp) {

        log(`a server connencted ${socketIp}`);

        lights_config.forEach(light => {
            if (socketIp == light.ipAddress) {
                light.socketId = socket.id;
                connected_lights.push(light);
                socket.emit('config', light);
            }
        })

        socket.broadcast.emit('lights', update_lights());

        socket.on('socket-client', (buttonInfo) => {

            const light = connected_lights.find(light => light.ipAddress == buttonInfo.servoIp);
            const selectedServo = light.servos.find(servo => servo.pin == buttonInfo.servoPin)
            io.to(light.socketId).emit("move-servo", selectedServo)     

        });

        socket.on('servo-update', (servoStatus) => {  
            connected_lights.map(light => {
                light.servos.map(servo => {
                    if (servo.displayName == servoStatus.displayName) {
                        servo.isOff = !servo.isOff;
                    }
                    return servo;
                })
                return light;
            })
            socket.broadcast.emit('lights', update_lights());

        })

    } else {
        socket.emit('lights', update_lights());

        socket.on('user-input', (servoName) => {
            const light = connected_lights.find(light => {
                const servo = light.servos.find(servo => servoName == servo.displayName);
                return servo != null;
            })
            const selectedServo = light.servos.find(servo => servoName == servo.displayName)
            io.to(light.socketId).emit("move-servo", selectedServo)     
        })
    } 


    socket.on('disconnect', () => {
        const socketIp = socket.request._query.ipAddress;
        if (socketIp) {

            connected_lights = connected_lights.filter((light) => {
                return socketIp != light.ipAddress;
            })
            socket.broadcast.emit('lights', update_lights());
            log(`a Server disconnected ${socketIp}`);
        } else {
            log('a user disconnected');
        }
    });
})
  
httpServer.listen(PORT, () =>
  log(`server listening at http://localhost:${PORT}`)
);