/*
 *  Author:     Geraldine Barreto
 *  Version:    1.0
 *  Licence:    LGPL-3.0 (GNU Lesser General Public License)
 *  
 *  Description:  Communication using Serial port of WiFi
 */

import  {teachButton, haltButton, limpButton, caliButton, COMmenu, delayT} from './canvas.js';

function checkIP(str) {
  const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gi;
  return regexExp.test(str);
}

async function sendHTTP(cmd) {
  const requestOptions = {
    method: 'POST',
    body: cmd,
    signal: AbortSignal.timeout(100)
  };

  try {
      await fetch(IP, requestOptions);
  } catch (err) {
      //
  }
}

var COMport = {
    OFF: 0,
    USB: 1,
    WIFI: 2
};

var ip, IP = "0.0.0.0";

export {COMport};

export class Communication
{    
    constructor(Port, Baudrate){
      this.selected = Port;
      this.baud = Baudrate;
      this.COMnumber = 0;
      this.usb = new p5.SerialPort();
    }
    initUSB(){
      if (this.usb.list().length != 0){
        this.usb.open(this.usb.list()[this.COMnumber], {baudRate: this.baud});
        console.log("Connected to " + this.usb.list()[this.COMnumber]);

        delayT(1000).then(() => {
          // LED Green
          this.usb.write("#254LED2\r");
          // Gyre Direction
          this.usb.write("#11G1\r#12G-1\r#13G-1\r");
          this.usb.write("#21G1\r#22G-1\r#23G-1\r");
          this.usb.write("#31G-1\r#32G1\r#33G1\r");
          this.usb.write("#41G-1\r#42G1\r#43G1\r");
          // Disable Motion Profile
          this.usb.write("#254EM0\r");
          // Filter Position Count
          this.usb.write("#254FPC4\r");
          // Angular Stiffness
          this.usb.write("#254AS-2\r");
          
          this.selected = COMport.USB;
        });
      }
      else{
        this.turnOFF("No serial port available");
        if (this.usb.list().length > this.COMnumber+1) this.COMnumber++;
      }
    }
    initWIFI(){
      ip = window.prompt("Please enter the device's IP address");
      if (checkIP(ip)){
        IP = "http://" + ip + ":1000";
        this.selected = COMport.WIFI;
      }
      else{
        IP = "0.0.0.0";
        this.turnOFF("Please enter a valid IP address");
      }
    }
    send(cmd){
      switch(this.selected){
        case COMport.USB:
          if (this.usb.list().length != 0) this.usb.write(cmd);
          break;
        case COMport.WIFI:
          sendHTTP(cmd);
          break;
        default:
          this.turnOFF("NO COM port connected");
          break;
      }
    }
    read(n){
      var str = null;
      switch(this.selected){
        case COMport.USB:
          if (this.usb.available() > 0) str = this.usb.readStringUntil(n);
          break;
        case COMport.WIFI:
          if (this.wifi.available() > 0) str = this.wifi.readStringUntil(n);
          break;
        default:
          this.turnOFF("NO COM port connected");
          break;
      }
      return str;
    }
    turnOFF(msg){
      alert(msg);
      
      if (this.selected == COMport.USB || this.selected == COMport.WIFI){
        //Turn off LEDs
        this.send("#254LED0\r");
        delayT(1000).then(() => {
          if (this.selected == COMport.USB){
            this.usb.close();
            closeSerial();
          }
        });
      }
      if (limpButton.button.value() == 1){
        limpButton.button.value(0);
        limpButton.button.style('background-color', 'rgb(57, 57, 57)');
      }
      if (teachButton.button.value() == 1){
        teachButton.button.value(0);
        teachButton.button.style('background-color', 'rgb(57, 57, 57)');
      }
      if (haltButton.button.value() == 1){
        haltButton.button.value(0);
        haltButton.button.style('background-color', 'rgb(57, 57, 57)');
      }
      if (caliButton.button.value() == 1){
        caliButton.button.value(0);
        caliButton.button.style('background-color', 'rgb(57, 57, 57)');
      }
      
      this.selected = COMport.OFF;
      COMmenu.value(0);
    }
};