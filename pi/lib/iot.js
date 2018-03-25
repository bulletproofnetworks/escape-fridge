const path = require('path');
const awsIot = require('aws-iot-device-sdk');
const gpio = require('rpi-gpio');

const certPath = path.join(__dirname, '..', 'certs');

class IoT {
  constructor(wss) {
    const deviceOptions = {
      keyPath: path.join(certPath, 'private.pem'),
      certPath: path.join(certPath, 'cert.pem'),
      caPath: path.join(certPath, 'symantec.pem'),
      clientId: process.env.THING_NAME,
      host: process.env.IOT_HOST,
      debug: true,
    };

    const thingShadow = awsIot.thingShadow(deviceOptions);

    thingShadow.on('connect', this.handleConnect.bind(this));
    thingShadow.on('status', this.handleStatus.bind(this));
    thingShadow.on('message', this.handleMessage.bind(this));
    thingShadow.on('delta', this.handleDelta.bind(this));
    thingShadow.on('error', this.handleError.bind(this));
    thingShadow.on('timeout', this.handleTimeout.bind(this));

    // TODO: Should we leave these here as debugging tools?
    // thingShadow.on('packetsend', this.handlePacketSend);
    // thingShadow.on('packetreceive', this.handlePacketReceive);

    this.thingShadow = thingShadow;
    this.wss = wss;

    this.temp_io = 'locked';
  }

  // TODO: Load this from PI IO pins?
  get fridgeState() { // eslint-disable-line class-methods-use-this
    const state = {
      state: this.temp_io,
    };

    return state;
  }

  get deviceState() { // eslint-disable-line class-methods-use-this
    const state = {
      fridge: this.fridgeState,
    };

    return state;
  }

  setFridgeState(state) {
    // TODO change IO PINS
    this.temp_io = state;

    this.updateShadow();
  }

  handleDelta(thingName, stateObject) {
    console.error(`received delta on ${thingName}: ${JSON.stringify(stateObject)}`);

    const desiredState = stateObject.state;
    const currentState = this.deviceState;

    if (currentState.fridge.state === desiredState.fridge.state) {
      console.error('state doesn\'t need to be changed');
      return;
    }

    console.error('Updating State');
    this.setFridgeState(desiredState.fridge.state);
  }

  updateShadow() {
    const state = {
      state: {
        reported: this.deviceState,
        desired: null,
      },
    };

    this.thingShadow.update(process.env.THING_NAME, state);
  }

  handleConnect() {
    this.thingShadow.register(process.env.THING_NAME, {}, () => {
      this.updateShadow();
    });

    this.thingShadow.subscribe('pi');
  }

  handleMessage(topic, data) {
    console.error('message', topic, data.toString());

    const payload = JSON.parse(data.toString());

    if (payload.cmd === 'take-photo') {
      this.wss.sendMessage({ cmd: 'take-photo' });
    }
    if (payload.cmd === 'result' && payload.isSmilling === 'success') {
      gpio.setup(7, gpio.DIR_HIGH).promise();
      gpio.write(7, false).promise();
    }
  }

  handleStatus(thingName, stat, clientToken, stateObject) { // eslint-disable-line class-methods-use-this
    console.error(`received ${stat} on ${thingName}: ${JSON.stringify(stateObject)}`);
  }

  // TODO: Should we leave this here as a debugging tool?
  // handlePacketSend(packet) { // eslint-disable-line class-methods-use-this
  //   console.error('SEND');
  //   console.error(packet);
  // }

  // TODO: Should we leave this here as a debugging tool?
  // handlePacketReceive(packet) { // eslint-disable-line class-methods-use-this
  //   console.error('RECEIVE');
  //   console.error(packet);
  // }

  handleError(error) { // eslint-disable-line class-methods-use-this
    console.error('ERROR');
    console.error(error);
  }

  handleTimeout(thingName, clientToken) { // eslint-disable-line class-methods-use-this
    console.error(`received timeout on ${thingName} with token: ${clientToken}`);
  }
}

exports.default = IoT;
