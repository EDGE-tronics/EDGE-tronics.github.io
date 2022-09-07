import {Quadruped} from './quadruped.js';
import {LSS_Robot_Model, Foot_Trajectory} from './IK_quad.js';
import {updateModel, robotAnimations, addOpacity} from './animations.js';
import {Communication, COMport} from './communication.js';

let wWidth, wHeight, footerHeight, canvasHeight, buttonHeight;
let header, leftCanvas, middleCanvas, rightCanvas, footer, button;
let logo, joystick1, joystick2, roboto;
let infoButton, COMmenu, BAUDmenu, emergencyButton, teachButton, haltButton;
let COMlabel, BAUDlabel, limpButton, caliButton, MODELmenu, labname, labcolor;
let labelCMD, directCMD, sendCMD, resetB, jogB, CCW, CW, leftB, rightB, W, A, S, D, jy, jY, jx, jX;
let DLabel, gaitTypesw, SLabel, speedLabel, speedSel, CLabel, gaitShapesw, SQLabel;
let checkbox, checkbox2, movesLabel, movesSel, ledLabel, LEDsel, seqButton;
let robotJoint = [[],[],[],[]], ctrlIK = [[],[]];
//let frameADD = [[],[],[],[],[],[]], frameN = [1,1,1,1,1,1], saveButton = [[],[],[],[],[],[]], sequencer = [[],[],[],[],[],[]], triggerMENU = [], sequence = [];
let headerHeight, leftWidth, rightWidth, middleWidth;
let speed = 4, servoI = 1, servoJ = 1;
let value;
let shouldHandleKeyDown = false;
let fbrl = [0, 0, 0, 0];
var robot = new Quadruped(LSS_Robot_Model.MechDog);
var comm, keyFlag = true, opacity = false;
var mobile = false;

class headerButtons{
  constructor(name,x,message){
    this.name = name;
    this.xPos = x;
    this.msg = message;
    this.clickEvent = this.clickEvent.bind(this);
    this.createButtons();
  }
  createButtons(){
    this.button = createButton(this.name);
    this.button.position(this.xPos,0.705*headerHeight);
    this.button.mousePressed(this.clickEvent);
    this.button.value(0);
  }
  updatePos(x) {
    this.xPos = x;
    this.button.position(x,0.705*headerHeight);
  }
  updateName(newname){
    this.button.html(newname);
  }
  clickEvent(){
    if (this.name == 'TEACH' || this.name == 'CALIBRATE'){
      if (this.button.value() == 1) this.button.value(0);
      else this.button.value(1);
    }
    else this.button.value(1);
    if (this.button.value() == 1){
      this.button.style('background-color', 'rgb(200,90,0)');
      if(comm.selected != COMport.OFF) alert("Please wait for the robot to " + this.msg);
    }
    let time = 3000;
    switch(this.name){
      case 'CALIBRATE':
        limp();
        calibrate();
        this.button.value(0);
        break;
      case 'LIMP':
        if (this.button.value() == 1) limp();
        else halt();
        break;
      case 'HALT & HOLD':
        halt();
        this.button.value(0);
        break;
      case 'HOLD':
        halt();
        this.button.value(0);
        break;
      case 'TEACH':
        if (this.button.value() == 1) limp();
        else halt();
        time = 100;
        break;
    }
    if (this.button.value() == 0) delayT(time).then(() => {this.button.style('background-color', 'rgb(57, 57, 57)');});
  }
}

class anglesInput{
  constructor(id,name,x,y,width,color, min, max){
    this.id = id;
    this.name = name;
    this.xPos = x;
    this.yPos = y;
    this.width = width/4;
    this.size = width/4.5;
    this.color = color;
    this.minVal = min;
    this.maxVal = max;
    this.inputEvent = this.inputEvent.bind(this);
    this.sliderEvent = this.sliderEvent.bind(this);
    this.createInputs();
  }
  createInputs() {
    this.label = createDiv(this.name);
    this.label.style('color', 'white');
    this.label.position(this.xPos,this.yPos);
    
    this.input = createInput(this.minVal+(this.maxVal-this.minVal)/2);
    this.input.style('color', this.color);
    this.input.position(this.xPos,this.yPos+this.label.height+5);
    this.input.size(this.size);
    this.input.input(this.inputEvent);

    this.slider = createSlider(this.minVal, this.maxVal, this.minVal+(this.maxVal-this.minVal)/2);
    this.slider.position(this.xPos-8,this.yPos+this.label.height+this.input.height+15);
    this.slider.style('width', (this.width).toString()+'px');
    this.slider.style('background-color', this.color);
    this.slider.changed(this.sliderEvent);
  }
  updateInputs(x,y,width) {
    this.label.position(x,y);

    this.input.position(x,y+this.label.height+5);
    this.input.size(width/4.5);

    this.slider.position(x-6,y+this.label.height+this.input.height+15);
    this.slider.style('width', (width/4).toString()+'px');
  }
  inputEvent() {
    if(this.input.value()<this.minVal || this.input.value()>this.maxVal){
      console.log(this.input.value() + " degrees is out of the range [" + str(this.minVal) + "," + str(this.maxVal) + "]");
    }
    this.slider.value(this.input.value());
  }
  sliderEvent(){
    this.input.value(this.slider.value());
    //Forward kinematics
    if(this.id >= 11 && comm.selected != COMport.OFF){
      angle = this.slider.value();

      //Check if direction is inverted
      if (this.id - this.id/10 > 1) angle = -angle;
      comm.send("#" + this.id + "D" + str(angle) + "\r");
    }
    //Inverse kinematics
    if (this.id < 11){
      //Update animations
      switch(this.name){
        case 'ROLL':
          robot.roll(this.slider.value());
          break;
        case 'PITCH':
          robot.pitch(this.slider.value());
          break;
        case 'YAW':
          robot.yaw(this.slider.value());
          break;
        case 'X':
          robot.frontalOffset(this.slider.value());
          break;
        case 'Y':
          robot.height(this.slider.value());
          break;
        case 'Z':
          robot.lateralOffset(this.slider.value());
          break;
      }
    }
  }
}

// class sequenceInput{
//   constructor(i,j){
//     this.x = i;
//     this.y = j;
//     this.minVal = 0;
//     this.maxVal = 100;
//     this.addFRAME = this.addFRAME.bind(this);
//     this.delFRAME = this.delFRAME.bind(this);
//     this.saveSEQ = this.saveSEQ.bind(this);
//     this.frameIN = [[],[],[],[],[],[]];
//     this.frameMOD = [[],[],[],[],[],[]];
//     this.modifierIN = [[],[],[],[],[],[]];
//     this.frameADD = [];
//     this.frameDEL = [];
//     this.saveButton = [];
//     this.createInputs();
//   }
//   createInputs() {
//     this.frameIN[this.x][this.y] = createInput('');
//     this.frameIN[this.x][this.y].attribute('placeholder', 'FRAME');
//     this.frameIN[this.x][this.y].size(50);
//     this.frameIN[this.x][this.y].position(leftWidth*0.07+185,headerHeight+canvasHeight+0.15*this.x*footerHeight);

//     this.frameMOD[this.x][this.y] = createSelect();
//     this.frameMOD[this.x][this.y].position(leftWidth*0.07+250,headerHeight+canvasHeight+0.15*this.x*footerHeight);
//     this.frameMOD[this.x][this.y].option('T');
//     this.frameMOD[this.x][this.y].option('S');
//     this.frameMOD[this.x][this.y].style('background-color', 'rgb(125, 125, 125)');

//     this.modifierIN[this.x][this.y] = createInput('0');
//     this.modifierIN[this.x][this.y].size(30);
//     this.modifierIN[this.x][this.y].position(leftWidth*0.07+290,headerHeight+canvasHeight+0.15*this.x*footerHeight);

//     this.frameADD[this.x] = createButton('+');
//     this.frameADD[this.x].position(leftWidth*0.07+333,headerHeight+canvasHeight+0.15*this.x*footerHeight);
//     this.frameADD[this.x].style('background-color', 'rgb(125, 125, 125)');
//     this.frameADD[this.x].style('box-shadow', 'none');
//     this.frameADD[this.x].mousePressed(this.addFRAME);

//     this.frameDEL[this.x] = createButton('-');
//     this.frameDEL[this.x].style('background-color', 'rgb(125, 125, 125)');
//     this.frameDEL[this.x].style('box-shadow', 'none');
//     this.frameDEL[this.x].style('width', '19px');
//     this.frameDEL[this.x].style('height', '18px');
//     this.frameDEL[this.x].mousePressed(this.delFRAME);

//     this.saveButton[this.x] = createButton('SAVE');
//     this.saveButton[this.x].style('background-color', 'rgb(125, 125, 125)');
//     this.saveButton[this.x].mousePressed(this.saveSEQ);
//   }
//   addFRAME(){
//     frameN[this.x]++;         //Frame counter for sequence x
//     this.y = frameN[this.x];  //When user adds a frame it creates other column [x][y]

//     this.frameIN[this.x][this.y] = createInput('');
//     this.frameIN[this.x][this.y].attribute('placeholder', 'FRAME');
//     this.frameIN[this.x][this.y].size(50);
//     this.frameIN[this.x][this.y].position(leftWidth*0.07+184+150*(this.y-1),headerHeight+canvasHeight+0.15*this.x*footerHeight);
    
//     this.frameMOD[this.x][this.y] = createSelect();
//     this.frameMOD[this.x][this.y].position(leftWidth*0.07+250+150*(this.y-1),headerHeight+canvasHeight+0.15*this.x*footerHeight);
//     this.frameMOD[this.x][this.y].option('T');
//     this.frameMOD[this.x][this.y].option('S');
//     this.frameMOD[this.x][this.y].style('background-color', 'rgb(125, 125, 125)');

//     this.modifierIN[this.x][this.y] = createInput('0');
//     this.modifierIN[this.x][this.y].size(30);
//     this.modifierIN[this.x][this.y].position(leftWidth*0.07+290+150*(this.y-1),headerHeight+canvasHeight+0.15*this.x*footerHeight);

//     this.frameADD[this.x].position(leftWidth*0.07+333+150*(this.y-1),headerHeight+canvasHeight+0.15*this.x*footerHeight);
//     this.frameDEL[this.x].position(leftWidth*0.07+360+150*(this.y-1),headerHeight+canvasHeight+0.15*this.x*footerHeight);
//     this.saveButton[this.x].position(leftWidth*0.07+385+150*(this.y-1),headerHeight+canvasHeight+0.15*this.x*footerHeight);
//   }
//   delFRAME(){
//     (this.frameIN[this.x]).splice(frameN[this.x],1);
//     frameN[this.x]--;
//   }
//   saveSEQ(){
//     alert("Saved sequence " + this.x);
//   }
// }

function delayT(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function setup(){
  comm = new Communication(COMport.OFF, 9600);

  //Switch width and height if the orientation changes
  if(deviceOrientation == LANDSCAPE){
    createCanvas(windowWidth,windowHeight, WEBGL);
    wWidth = windowWidth;
    wHeight = windowHeight;
  }
  else{
    createCanvas(windowHeight,windowWidth, WEBGL);
    wWidth = windowHeight;
    wHeight = windowWidth;
  }

  if (wHeight >= 700) headerHeight = 0.15*wHeight;
  else headerHeight = 0.17*wHeight;
  footerHeight = 1;

  canvasSize();

  logo = loadImage('assets/logo.png');
  joystick1 = loadImage("assets/joystick1.png");
  joystick2 = loadImage("assets/joystick2.png");
  roboto = loadFont('assets/roboto.ttf');

  //Set up header buttons and menus
  infoButton = createSelect();
  infoButton.value(0);
  infoButton.position(wWidth-1/3.5*headerHeight, 1/3.5*headerHeight);
  infoButton.size(18,18);
  infoButton.style('border-radius','50%');
  infoButton.style('box-shadow', '1px 1px 1px 1px black');
  infoButton.style('background-image', 'linear-gradient(to bottom right, black, grey)');
  infoButton.option('Wiki',0);
  infoButton.option('Github',1);
  infoButton.option('Community',2);
  infoButton.changed(informationB);
  //COM port menu
  COMmenu = createSelect();
  COMmenu.position(wWidth-25-int(wWidth/25), 0.7*headerHeight);
  COMmenu.option('OFF', 0);
  COMmenu.option('USB', 1);
  COMmenu.option('WIFI', 2);
  COMmenu.selected('OFF');
  COMmenu.changed(menuCOM);
  COMlabel = createDiv('COM');
  COMlabel.style('color', 'rgb(57, 57, 57)');
  COMlabel.position(wWidth-COMmenu.width-45-int(wWidth/25), 0.705*headerHeight);
  //Baudrate menu
  BAUDmenu = createSelect();
  BAUDmenu.position(COMlabel.position().x-BAUDmenu.width-15-int(wWidth/25),0.7*headerHeight);
  BAUDmenu.option('9600');
  BAUDmenu.option('19200');
  BAUDmenu.option('38400');
  BAUDmenu.option('57600');
  BAUDmenu.selected('9600');
  BAUDmenu.disable();
  BAUDmenu.changed(menuBAUD);
  BAUDlabel = createDiv('BAUD');
  BAUDlabel.style('color', 'rgb(57, 57, 57)');
  BAUDlabel.position(BAUDmenu.position().x-50, 0.705*headerHeight);
  //Emergency button
  emergencyButton = createButton('');
  emergencyButton.position(BAUDlabel.position().x-35-int(wWidth/25), 0.65*headerHeight);
  emergencyButton.size(85,85);
  emergencyButton.style('box-shadow', 'none');
  emergencyButton.style('background-color','rgb(254, 175, 60)');
  emergencyButton.style('border-radius','50%');
  emergencyButton.addClass('emergency');
  emergencyButton.mousePressed(changeButtonE);
  //Teach button
  teachButton = new headerButtons('TEACH',emergencyButton.position().x-15-int(wWidth/25),'go limp');
  //Halt & Hold button
  haltButton = new headerButtons('HALT & HOLD',teachButton.xPos-62-int(wWidth/25),'halt and hold');
  if (wWidth<1000){
    haltButton.updateName('HOLD');
    COMlabel.html('COM');
    BAUDlabel.html('BAUD');
    COMlabel.position(wWidth-COMmenu.width-40-int(wWidth/25), 0.705*headerHeight);
    BAUDlabel.position(BAUDmenu.position().x-43, 0.705*headerHeight);
    emergencyButton.position(BAUDlabel.position().x-40-int(wWidth/25), 0.65*headerHeight);
    if(mobile){
      COMlabel.html('');
      BAUDmenu.position(COMlabel.position().x-3-int(wWidth/25),0.7*headerHeight);
      BAUDlabel.html('');
      emergencyButton.position(COMmenu.position().x-45-int(wWidth/25), 0.55*headerHeight);
      teachButton.updatePos(emergencyButton.position().x-19-int(wWidth/25));
      emergencyButton.size(75,75);
    }
    haltButton.updatePos(teachButton.xPos-17-int(wWidth/25));
  }
  //Limp button
  limpButton = new headerButtons('LIMP',haltButton.xPos-16-int(wWidth/25),'go limp');
  //Calibrate button
  caliButton = new headerButtons('CALIBRATE',limpButton.xPos-50-int(wWidth/25),'go limp, place the robot in the calibration posture and press OK');
  //Robot model menu
  MODELmenu = createSelect();
  MODELmenu.position(caliButton.xPos-55-int(wWidth/25), 0.705*headerHeight);
  MODELmenu.option('DESKPET');
  MODELmenu.option('MECHDOG');
  MODELmenu.disable('DESKPET');
  MODELmenu.selected('MECHDOG');
  MODELmenu.changed(updateModel);

  //Left canvas inputs
  for(let i = 0; i <= 3; i++){
    for (let j = 0; j <= 2; j++){
      switch(j){
        case 0:
          labcolor = 'rgb(200,90,0)';
          switch(i){
            case 0:
              labname = 'RIGHT REAR';
              break;
            case 1:
              labname = 'RIGHT FRONT';
              break;
            case 2:
              labname = 'LEFT REAR';
              break;
            case 3:
              labname = 'LEFT FRONT';
              break;
          }
          min = -30;
          max = 60;
          break;
        case 1:
          labcolor = 'Orange';
          labname = '&nbsp;';
          min = -30;
          max = 100;
          break;
        case 2:
          labcolor = 'Black';
          labname = '&nbsp;';
          min = -200;
          max = -5;
          break;
      }
      robotJoint[i][j] = new anglesInput((i+1)*10+j+1,labname,leftWidth*(j*0.3+0.07),headerHeight+20+i*canvasHeight/5, leftWidth, labcolor, min, max);
    }
  }

  labelCMD = createDiv("DIRECT COMMAND");
  labelCMD.style('color', 'white');
  labelCMD.position(leftWidth*0.06,headerHeight+25+4*canvasHeight/5);

  directCMD = createInput();
  directCMD.style('color', 'Black');
  directCMD.position(leftWidth*0.06,headerHeight+25+4.3*canvasHeight/5);
  directCMD.size(leftWidth*0.6,20);
  directCMD.mouseOver(keyLock);
  directCMD.mouseOut(keyUnlock);

  sendCMD = createButton("SEND");
  sendCMD.position(leftWidth*0.72,headerHeight+27+4.3*canvasHeight/5);
  sendCMD.mousePressed(CMDsend);
  sendCMD.value(0);

  resetB = createButton("R");
  resetB.position(leftWidth+middleWidth+rightWidth/2+15,headerHeight+canvasHeight*3.5/5);
  resetB.size(20,20);
  resetB.style('box-shadow', 'none');
  resetB.mousePressed(reset);

  jogB = createButton("J");
  jogB.position(leftWidth+middleWidth+rightWidth/2-25,headerHeight+canvasHeight*3.5/5);
  jogB.size(20,20);
  jogB.style('box-shadow', 'none');
  jogB.value(0);
  jogB.mousePressed(jog);

  //Right canvas inputs
  for(let i = 0; i < 2; i++){
    for (let j = 0; j < 3; j++){
      switch(j){
        case 0:
          if (i == 0) {
            labname = "ROLL";
            min = -20;
            max = 20;
          } else {
            labname = "X";
            min = -45;
            max = 45;
          }
          labcolor = color(200, 90, 0);
          break;
        case 1:
          if (i == 0) {
            labname = "PITCH";
            min = -25;
            max = 25;
          } else {
            labname = "Y";
            min = 50;
            max = 155;
          }
          labcolor = color(254, 175, 60);
          break;
        case 2:
          if (i == 0) {
            labname = "YAW";
            min = -20;
            max = 20;
          } else {
            labname = "Z";
           if (MODELmenu.selected() == "MECHDOG"){
              min = -30;
              max = 30;
            }
            else{
              min = -25;
              max = 25;
            }
          }
          labcolor = color(57, 57, 57);
          break;
      }
      ctrlIK[i][j] = new anglesInput(i*3+j+2,labname,leftWidth+middleWidth+rightWidth*(j*0.3+0.07), headerHeight+20+i*canvasHeight/5, leftWidth, labcolor, min, max);
    }
  }

  CCW = createButton("");
  CCW.position(leftWidth+middleWidth+rightWidth/11,headerHeight+canvasHeight/2.6);
  CCW.size(30,30);
  CCW.html('&#x21BA;');
  CCW.style('border-radius','50%');
  CCW.style('box-shadow', 'none');
  CCW.style('font-size','20px');
  CCW.mousePressed(rotateCCW);
  CCW.value(1);

  CW = createButton("");
  CW.position(leftWidth+middleWidth+rightWidth/2-42,headerHeight+canvasHeight/2.6);
  CW.size(30,30);
  CW.html('	&#x21BB;');
  CW.style('border-radius','50%');
  CW.style('box-shadow', 'none');
  CW.style('font-size','20px');
  CW.mousePressed(rotateCW);
  CW.value(1);

  leftB = createButton("");
  leftB.position(leftWidth+middleWidth+rightWidth/2+20,headerHeight+canvasHeight/2.6);
  leftB.size(30,30);
  leftB.html('&#x2190;');
  leftB.style('border-radius','50%');
  leftB.style('box-shadow', 'none');
  leftB.style('font-size','20px');
  leftB.mousePressed(goLeft);
  leftB.value(1);

  rightB = createButton("");
  rightB.position(leftWidth+middleWidth+rightWidth-46,headerHeight+canvasHeight/2.6);
  rightB.size(30,30);
  rightB.html('&#x2192;');
  rightB.style('border-radius','50%');
  rightB.style('box-shadow', 'none');
  rightB.style('font-size','20px');
  rightB.mousePressed(goRight);
  rightB.value(1);

  W = createCheckbox("");
  W.position(leftWidth+middleWidth+rightWidth/4-5,headerHeight+canvasHeight/2.15);
  W.style('transform', 'scale(' + str(buttonHeight) + ')');
  W.style('opacity', '0');
  W.changed(forward);

  A = createCheckbox("");
  A.position(leftWidth+middleWidth+rightWidth/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  A.style('transform', 'scale(' + str(buttonHeight) + ')');
  A.style('opacity', '0');
  A.changed(left);

  S = createCheckbox("");
  S.position(leftWidth+middleWidth+rightWidth/4-5,headerHeight+canvasHeight/2.2+leftWidth/3.8);
  S.style('transform', 'scale(' + str(buttonHeight) + ')');
  S.style('opacity', '0');
  S.changed(backward);

  D = createCheckbox("");
  D.position(leftWidth+middleWidth+rightWidth*2.9/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  D.style('transform', 'scale(' + str(buttonHeight) + ')');
  D.style('opacity', '0');
  D.changed(right);

  jY = createCheckbox("");
  jY.position(leftWidth+middleWidth+rightWidth*3/4-10,headerHeight+canvasHeight/2.15);
  jY.style('transform', 'scale(' + str(buttonHeight) + ')');
  jY.style('opacity', '0');
  jY.changed(Yplus);

  jx = createCheckbox("");
  jx.position(leftWidth+middleWidth+rightWidth*5/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  jx.style('transform', 'scale(' + str(buttonHeight) + ')');
  jx.style('opacity', '0');
  jx.changed(Xminus);

  jX = createCheckbox("");
  jX.position(leftWidth+middleWidth+rightWidth*6.7/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  jX.style('transform', 'scale(' + str(buttonHeight) + ')');
  jX.style('opacity', '0');
  jX.changed(Xplus);

  jy = createCheckbox("");
  jy.position(leftWidth+middleWidth+rightWidth*3/4-10,headerHeight+canvasHeight/2.2+leftWidth/3.8);
  jy.style('transform', 'scale(' + str(buttonHeight) + ')');
  jy.style('opacity', '0');
  jy.changed(Yminus);

  DLabel = createDiv("D");
  DLabel.style('color', 'white');
  DLabel.position(leftWidth+middleWidth+rightWidth/8,headerHeight+canvasHeight*4/5);

  gaitTypesw = createElement(
    'label',
    '<input id="toggle" type="checkbox"/><span class="slider round"></span>'); 
  gaitTypesw.addClass('switch');
  gaitTypesw.position(leftWidth+middleWidth+rightWidth/4-17,headerHeight+canvasHeight*4/5);
  checkbox = select('#toggle');
  checkbox.changed(gaitType);

  SLabel = createDiv("S");
  SLabel.style('color', 'white');
  SLabel.position(leftWidth+middleWidth+rightWidth/8+rightWidth/4,headerHeight+canvasHeight*4/5);

  speedLabel = createDiv("SPEED");
  speedLabel.style('color', 'white');
  speedLabel.position(leftWidth+middleWidth+rightWidth/2-15,headerHeight+canvasHeight*3.8/5);

  speedSel = createSelect();
  speedSel.position(leftWidth+middleWidth+rightWidth/2-10,speedLabel.position().y+20);
  speedSel.option('1');
  speedSel.option('2');
  speedSel.option('3');
  speedSel.option('4');
  speedSel.selected('4');
  speedSel.changed(selectSpeed);
  CLabel = createDiv("C");
  CLabel.style('color', 'white');
  CLabel.position(leftWidth+middleWidth+rightWidth/8+rightWidth/2,headerHeight+canvasHeight*3.8/5);
  
  gaitShapesw = createElement(
    'label',
    '<input id="toggle" type="checkbox" /><span class="slider round"></span>'); 
  gaitShapesw.addClass('switch');
  gaitShapesw.position(leftWidth+middleWidth+rightWidth*3/4-17,headerHeight+canvasHeight*3.8/5);
  checkbox2 = select('#toggle', gaitShapesw);
  checkbox2.changed(gaitShape);
  
  SQLabel = createDiv("S");
  SQLabel.style('color', 'white');
  SQLabel.position(leftWidth+middleWidth+rightWidth-rightWidth/8,headerHeight+canvasHeight*3.8/5);
  
  if (wWidth >= 1050) movesLabel = createDiv("SPECIAL MOVES");
  else movesLabel = createDiv("MOVES");
  movesLabel.style('color', 'white');
  movesLabel.position(leftWidth+middleWidth+rightWidth*0.07,headerHeight+25+canvasHeight*5/6);

  movesSel = createSelect();
  movesSel.position(leftWidth+middleWidth+rightWidth*0.07,headerHeight+45+canvasHeight*5/6);
  movesSel.option('UP',0);
  movesSel.option('SIT',1);
  movesSel.option('LAY',2);
  movesSel.option('PAW',3);
  movesSel.option('WIGGLE',4);
  movesSel.option('TINKLE',5);
  movesSel.option('STRETCH',6);
  movesSel.selected('UP');
  movesSel.changed(selectMoves);

  ledLabel = createDiv("LED");
  ledLabel.style('color', 'white');
  ledLabel.position(leftWidth+middleWidth+rightWidth*3/4-20,headerHeight+25+canvasHeight*5/6);

  LEDsel = createSelect();
  LEDsel.position(leftWidth+middleWidth+rightWidth*3/4-20,headerHeight+45+canvasHeight*5/6);
  LEDsel.option('OFF',0);
  LEDsel.option('RED',1);
  LEDsel.option('GREEN',2);
  LEDsel.option('BLUE',3);
  LEDsel.option('YELLOW',4);
  LEDsel.option('CYAN',5);
  LEDsel.option('PINK',6);
  LEDsel.option('WHITE',7);
  LEDsel.selected('GREEN');
  LEDsel.changed(selectLED);

  seqButton = createButton("");
  seqButton.position(leftWidth+middleWidth+rightWidth-30,wHeight-30);
  seqButton.size(25,25);
  seqButton.html('>');
  seqButton.style('border-radius','50%');
  seqButton.style('box-shadow', 'none');
  seqButton.style('font-size','15px');
  seqButton.style('transform','rotate(-90deg)');
  seqButton.mousePressed(hideSeq);
  seqButton.value(0);
  windowResized();

  if (mobile) seqButton.hide();

  //Robot Model
  updateModel();

  reset();
  
  //Footer inputs
  // for(let i = 1; i < 6; i++){
  //   triggerMENU[i] = createSelect();
  //   triggerMENU[i].position(leftWidth*0.07,headerHeight+canvasHeight+0.15*i*footerHeight);
  //   triggerMENU[i].option('TRIGGER');
  //   triggerMENU[i].option('FACE');
  //   triggerMENU[i].option('BALL');
  //   triggerMENU[i].option('ARROW UP');
  //   triggerMENU[i].option('ARROW DOWN');
  //   triggerMENU[i].option('ARROW LEFT');
  //   triggerMENU[i].option('ARROW RIGHT');
  //   triggerMENU[i].selected('TRIGGER');
  //   triggerMENU[i].style('width', '80px');
  //   triggerMENU[i].style('background-color', 'rgb(125, 125, 125)');

  //   sequence[i] = createDiv('SEQUENCE ' + i);
  //   sequence[i].style('color', 'white');
  //   sequence[i].style('font-family', 'Roboto');
  //   sequence[i].position(leftWidth*0.07+90,headerHeight+canvasHeight+0.15*i*footerHeight);

  //   for(let i = 1; i < 6; i++) sequencer[i] = new sequenceInput(i,0);
  // }
}

//Direct command
function CMDsend(){
  comm.send("#" + directCMD.value() + "\r");
  directCMD.value("");
}

function keyLock(){
  keyFlag = false;
}

function keyUnlock(){
  keyFlag = true;
}

function hideSeq(){
  if (seqButton.value() == 1){
    seqButton.html('>');
    seqButton.value(0);
  }
  else{
    seqButton.html('<');
    seqButton.value(1);
  }
  windowResized();
}

function reset(){
  resetB.style('background-color', 'rgb(200,90,0)');
  console.log("Reset");
  for(let i = 0; i < 2; i++){
    for (let j = 0; j < 3; j++){
      ctrlIK[i][j].slider.value(0);
      ctrlIK[i][j].input.value(0);
    }
  }
  ctrlIK[1][1].slider.value(ctrlIK[1][1].maxVal);
  ctrlIK[1][1].input.value(ctrlIK[1][1].slider.value());
  robot.roll(ctrlIK[0][0].slider.value());
  robot.pitch(ctrlIK[0][1].slider.value());
  robot.yaw(ctrlIK[0][2].slider.value());
  robot.frontalOffset(ctrlIK[1][0].slider.value());
  robot.height(ctrlIK[1][1].slider.value());
  robot.lateralOffset(ctrlIK[1][2].slider.value());
  delayT(20).then(() => {resetB.style('background-color', 'rgb(57, 57, 57)');});
}

function jog(){
  if (jogB.value() == 0){
    jogB.value(1);
    jogB.style('background-color', 'rgb(200,90,0)');
    console.log("Jog On");
    robot.specialMove(7);
  }
  else if (jogB.value() == 1){
    jogB.value(0);
    jogB.style('background-color', 'rgb(57, 57, 57)');
    console.log("Jog Off");
    robot.specialMove(8); 
  }
}

function forward(){
  if (W.checked()){
    console.log("Forward");
    fbrl[0] = 1;
  }
  else{
    console.log("Stop");
    fbrl[0] = 0;
  }
}

function left(){
  if (A.checked()){
    console.log('Strafe left');
    fbrl[3] = 1;
  }
  else{
    console.log("Stop");
    fbrl[3] = 0;
  }
}

function backward(){
  if (S.checked()){
    console.log('Backward');
    fbrl[1] = -1;
  }
  else{
    console.log("Stop");
    fbrl[1] = 0;
  }
}

function right(){
  if (D.checked()){
    console.log('Strafe right')
    fbrl[2] = -1;
  }
  else{
    console.log("Stop");
    fbrl[2] = 0;
  }
}


function rotateCCW(){
  if (CCW.value() == 1){
    console.log("Rotate CCW");
    CCW.style('background-color', 'rgb(200,90,0)');
    CCW.value(0);
    value = -1;
  }
  else{
    console.log("Stop rotation");
    CCW.style('background-color', 'rgb(57,57,57)');
    CCW.value(1);
    value = 0;
  }
  robot.rotate(value);
}

function rotateCW(){
  if (CW.value() == 1){
    console.log("Rotate CW");
    CW.style('background-color', 'rgb(200,90,0)');
    CW.value(0);
    value = 1;
  }
  else{
    console.log("Stop rotation");
    CW.style('background-color', 'rgb(57,57,57)');
    CW.value(1);
    value = 0;
  }
  robot.rotate(value);
}

function Xplus(){
  console.log('X+');
  updateSliders(1, 1, 0);
  robot.frontalOffset( ctrlIK[1][0].slider.value());
}

function Xminus(){
  console.log('X-');
  updateSliders(-1, 1, 0);
  robot.frontalOffset(ctrlIK[1][0].slider.value());
}

function Yplus(){
  console.log('Y+');
  updateSliders(1, 1, 1);
  robot.height(ctrlIK[1][1].slider.value());
}

function Yminus(){
  console.log('Y-');
  updateSliders(-1, 1, 1);
  robot.height(ctrlIK[1][1].slider.value());
}

function goLeft(){
  console.log('Z-');
  leftB.style('background-color', 'rgb(200,90,0)');
  updateSliders(-1, 1, 2);
  robot.lateralOffset(ctrlIK[1][2].slider.value());
  delayT(20).then(() => {leftB.style('background-color', 'rgb(57, 57, 57)');});
}

function goRight(){
  console.log('Z+');
  rightB.style('background-color', 'rgb(200,90,0)');
  updateSliders(1, 1, 2);
  robot.lateralOffset(ctrlIK[1][2].slider.value());
  delayT(20).then(() => {rightB.style('background-color', 'rgb(57, 57, 57)');});
}

function updateSliders(sign, i, j){
  if (sign > 0){
    if (int(ctrlIK[i][j].input.value())+5 <= ctrlIK[i][j].maxVal){
      ctrlIK[i][j].slider.value(int(ctrlIK[i][j].input.value())+5);
      ctrlIK[i][j].input.value(ctrlIK[i][j].slider.value());
    }
    else{
      ctrlIK[i][j].slider.value(int(ctrlIK[i][j].maxVal));
      ctrlIK[i][j].input.value(ctrlIK[i][j].slider.value());
    }
  }
  else{
    if (int(ctrlIK[i][j].input.value())-5 >= ctrlIK[i][j].minVal){
      ctrlIK[i][j].slider.value(int(ctrlIK[i][j].input.value())-5);
      ctrlIK[i][j].input.value(ctrlIK[i][j].slider.value());
    }
    else{
      ctrlIK[i][j].slider.value(int(ctrlIK[i][j].minVal));
      ctrlIK[i][j].input.value(ctrlIK[i][j].slider.value());
    }
  }
}

//Walking speed selection
function selectSpeed(){
  speed = speedSel.value();

  if (speed == 4) checkbox.checked(0);
  else checkbox.checked(1);
  
  robot.setSpeed(parseInt(speed));
  robot.changeSpeed(parseInt(speed));

  if(comm.selected == COMport.USB){
    switch (speed) {
      case StopMoveSpeed:
          comm.send("#254FPC13\r");
          break;
      case SpecialMoveSpeed:
          comm.send("#254FPC14\r");
          break;
      case 1:
          comm.send("#254FPC4\r");
          break;
      case 2:
          comm.send("#254FPC4\r");
          break;
      case 3:
          comm.send("#254FPC3\r");
          break;
      case 4:
          comm.send("#254FPC3\r");
          break;
    }
  }
  if (comm.selected == COMport.WIFI && speed > 0) comm.send("#100M" + str(robot.orientation(fbrl)) + "S" + speed + "\r");
}

//Special moves
function selectMoves(){
  robot.specialMove(parseInt(movesSel.value()));
}

function selectLED(){
  comm.send("#254LED" + LEDsel.value() + "\r");
}

//Emergency Stop
function changeButtonE() {
  halt();
  if (comm.selected != COMport.OFF){
    emergencyButton.style('background-color', 'rgb(200,90,0)');
    delayT(500).then(() => alert("Emergency stop activated"));
    delayT(3000).then(() => emergencyButton.style('background-color', 'rgb(254, 175, 60)'));
  }
}

function calibrate(){
//TODO: test function 
  if(serial.length != 0 && comm.selected == COMport.USB){
      if(limpButton.value() == 0){
        alert("Press LIMP & position the robot");
        comm.send("#254LED1\r");
        caliButton.button.value(0);
        caliButton.button.style('background-color', 'rgb(57, 57, 57)');
      }
      else if(caliButton.button.value() == 1){
        comm.send("#254CO\r");
        for(let i = 1; i <= 4; i++){
          for (let j = 1; j <= 3; j++){
            comm.send("#" + str(i) + str(j) + "QD" + "\r");
            data = comm.read("*");
            while (data == null){
              data = comm.read("*");
              if(data == "") break;
            }
            posFeedback = comm.read("\r");
            while (posFeedback == null){
              posFeedback = comm.read("\r");
              if(posFeedback == "") break;
            }
            position = split(posFeedback,"QD");
            if (position.length > 1){
              servonumber = int(position[0].substring(1));
              servoposition = int(position[1])/10;
              if (abs(servopos) > 1) {
                alert("Calibration error in servo " + str(servonumber));
              } else {
                alert("The robot has been calibrated");
              }
            }
          }
        }
      }
    }
    else{
      alert("Please select a COM port");
      COMmenu.value('OFF');
      caliButton.button.value(0);
      caliButton.button.style('background-color', 'rgb(57, 57, 57)');
    }
}

function limp(){
  comm.send("#254L\r");
}

function halt(){
  comm.send("#254H\r");
}

function menuBAUD() {
  //Update baudrate
  comm.baud = int(BAUDmenu.value());
  //Send command
  //comm.send("#254CB" + str(baudrate) + "\r");
  delayT(1000).then(() => {comm.send("#254RESET\r")});
  //ports.open(comm.usb.list()[comm.COMnumber], {baudRate: comm.baud});
}

function informationB(){
  switch(parseInt(infoButton.value())){
    case 0:
      window.open('https://docs.google.com/document/d/1l8P6cEEyHwDhbbdA-603aYjDc3sLHclymzqD1oP1LYg/');
      break;
    case 1:
      window.open('https://github.com/Robotics-Technology/Desk-Pet');
      break;
    case 2:
      window.open('https://www.robotshop.com/community/forum/latest');
      break;
  }
}

function menuCOM(){
  switch(parseInt(COMmenu.value())){
    case 1:
      comm.selected = COMport.USB;
      comm.initUSB();
      break;
    case 2:
      comm.selected = COMport.WIFI;
      comm.initWIFI();
      break;
    default:
      comm.selected = COMport.OFF;
      comm.turnOFF("COM port OFF");
      break;
  }
}

function getFeedback(){
  if (serial.length != 0 && comm.selected == COMport.USB){
    comm.send("#" + str(servoI) + str(servoJ) + "QD" + "\r");
    posFeedback = comm.read("\r");
    if (posFeedback){
      position = split(posFeedback,"QD");
      servonumber = int(position[0].substring(1));
      servoposition = int(position[1])/10;
      i = int(servonumber/10);
      j = servonumber - i*10;
      if (j <= 1){
        robotJoint[i-1][j-1].input.value(int(servoposition));
        robotJoint[i-1][j-1].slider.value(int(servoposition));
      }
      else{
        robotJoint[i-1][j-1].input.value(-int(servoposition));
        robotJoint[i-1][j-1].slider.value(-int(servoposition));
      }
      if (servoJ == 3) {
        servoJ = 1;
        if (servoI == 4) servoI = 1; 
        else servoI++;
      } else servoJ++;
    }
}
}

function gaitType() {
  if (this.checked()) {
    console.log("Static");
    speedSel.value(3);
    robot.setSpeed(3);
    robot.changeSpeed(3);
  } else {
    console.log("Dynamic");
    speedSel.value(4);
    robot.setSpeed(4);
    robot.changeSpeed(4);
  }
  speed = speedSel.value();
  if(comm.selected == COMport.USB){
    switch (speed) {
      case 3:
          comm.send("#254FPC3\r");
          break;
      case 4:
          comm.send("#254FPC3\r");
          break;
    }
  }
  if (comm.selected == COMport.WIFI && speed > 0) comm.send("#100M0V" + str(robot.orientation(fbrl)) + "S" + speed + "\r");
}

function gaitShape() {
  if (this.checked()) {
    console.log("Square");
    value = 0;
    robot.gaitType(Foot_Trajectory.Square);
  } else {
    console.log("Circular");
    value = 1;
    robot.gaitType(Foot_Trajectory.Circular);
  }
}

function canvasSize(){

  canvasHeight = wHeight - headerHeight - footerHeight;
  
  buttonHeight = wWidth*0.0021;

  if (wWidth < 900 || wHeight < 500) mobile = true;
  else mobile = false;

  //Establish min size for canvases
  if (mobile){
    leftWidth = 0.5*wWidth;
    rightWidth = 0.5*wWidth;
    middleWidth = 1;
  }
  else{
    if (wWidth >= 1000){
      leftWidth = 0.2*wWidth;
      middleWidth = 0.6*wWidth;
      rightWidth = 0.2*wWidth;  
    }
    else{
      leftWidth = 200;
      rightWidth = 200;
    }
    middleWidth = wWidth - leftWidth - rightWidth;
  }

  //Set up the canvases
  header = createGraphics(wWidth,headerHeight);
  leftCanvas = createGraphics(leftWidth,canvasHeight);
  middleCanvas = createGraphics(middleWidth,canvasHeight);
  rightCanvas = createGraphics(rightWidth,canvasHeight);
  footer = createGraphics(wWidth,footerHeight);
  button = createGraphics(leftWidth/12,leftWidth/12);
}

function windowResized() {
  if(windowWidth >= windowHeight){
    resizeCanvas(windowWidth,windowHeight);
    wWidth = windowWidth;
    wHeight = windowHeight;
  }
  else{
    resizeCanvas(windowHeight,windowWidth);
    wWidth = windowHeight;
    wHeight = windowWidth;
  }

  if (wHeight >= 700) headerHeight = 0.15*wHeight;
  else headerHeight = 0.17*wHeight;

  if (seqButton.value() == 0) footerHeight = 0;
  else{
    if (wHeight >= 700) footerHeight = 0.25*wHeight;
    else footerHeight = 150;
  }
  canvasSize();

  infoButton.position(wWidth-1/4*headerHeight, 1/3.5*headerHeight);

  COMmenu.position(wWidth-25-int(wWidth/25), 0.7*headerHeight);
  COMlabel.position(wWidth-COMmenu.width-45-int(wWidth/25), 0.705*headerHeight);
  BAUDmenu.position(COMlabel.position().x-BAUDmenu.width-15-int(wWidth/25),0.7*headerHeight);
  BAUDlabel.position(BAUDmenu.position().x-50, 0.705*headerHeight);
  emergencyButton.position(BAUDlabel.position().x-40-int(wWidth/25), 0.65*headerHeight);
  emergencyButton.size(85,85);
  teachButton.updatePos(emergencyButton.position().x-15-int(wWidth/25));
  if (wWidth>= 1000){
    movesLabel.html('SPECIAL MOVES');
    haltButton.updateName('HALT & HOLD');
    COMlabel.html('COM');
    BAUDlabel.html('BAUD');
    haltButton.updatePos(teachButton.xPos-62-int(wWidth/25));
  }
  if (wWidth<1000){
    movesLabel.html('MOVES');
    haltButton.updateName('HOLD');
    COMlabel.html('COM');
    BAUDlabel.html('BAUD');
    COMlabel.position(wWidth-COMmenu.width-40-int(wWidth/25), 0.705*headerHeight);
    BAUDlabel.position(BAUDmenu.position().x-43, 0.705*headerHeight);
    emergencyButton.position(BAUDlabel.position().x-40-int(wWidth/25), 0.65*headerHeight);
    if(mobile){
      COMlabel.html('');
      BAUDmenu.position(COMlabel.position().x-3-int(wWidth/25),0.7*headerHeight);
      BAUDlabel.html('');
      emergencyButton.position(COMmenu.position().x-45-int(wWidth/25), 0.55*headerHeight);
      teachButton.updatePos(emergencyButton.position().x-19-int(wWidth/25));
      emergencyButton.size(75,75);
    }
    haltButton.updatePos(teachButton.xPos-17-int(wWidth/25));
  }
  limpButton.updatePos(haltButton.xPos-16-int(wWidth/25));
  caliButton.updatePos(limpButton.xPos-50-int(wWidth/25));
  MODELmenu.position(caliButton.xPos-55-int(wWidth/25), 0.705*headerHeight);

  //Left canvas inputs
  for(let i = 0; i <= 3; i++){
    for (let j = 0; j <= 2; j++){
      robotJoint[i][j].updateInputs(leftWidth*(j*0.3+0.07),headerHeight+20+i*canvasHeight/5,leftWidth);
    }
  }

  labelCMD.position(leftWidth*0.06,headerHeight+25+4*canvasHeight/5);
  directCMD.position(leftWidth*0.06,headerHeight+25+4.3*canvasHeight/5);
  directCMD.size(leftWidth*0.6,20);
  sendCMD.position(leftWidth*0.72,headerHeight+27+4.3*canvasHeight/5);

  //Right canvas inputs
  for(let i = 0; i < 2; i++){
    for (let j = 0; j < 3; j++){
      ctrlIK[i][j].updateInputs(leftWidth+middleWidth+rightWidth*(j*0.3+0.07), headerHeight+20+i*canvasHeight/5, leftWidth);
    }
  }
  let buttonsPos;
  if(mobile) buttonsPos = headerHeight+canvasHeight/2.2;
  else buttonsPos = headerHeight+canvasHeight/2.6;

  CCW.position(leftWidth+middleWidth+rightWidth/11,buttonsPos);
  CW.position(leftWidth+middleWidth+rightWidth/2-42,buttonsPos);
  leftB.position(leftWidth+middleWidth+rightWidth/2+20,buttonsPos);
  rightB.position(leftWidth+middleWidth+rightWidth-46,buttonsPos);

  W.position(leftWidth+middleWidth+rightWidth/4-5,headerHeight+canvasHeight/2.15);
  W.style('transform', 'scale(' + str(buttonHeight) + ')');
  A.position(leftWidth+middleWidth+rightWidth/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  A.style('transform', 'scale(' + str(buttonHeight) + ')');
  S.position(leftWidth+middleWidth+rightWidth/4-5,headerHeight+canvasHeight/2.2+leftWidth/3.8);
  S.style('transform', 'scale(' + str(buttonHeight) + ')');
  D.position(leftWidth+middleWidth+rightWidth*2.9/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  D.style('transform', 'scale(' + str(buttonHeight) + ')');

  jY.position(leftWidth+middleWidth+rightWidth*3/4-10,headerHeight+canvasHeight/2.15);
  jY.style('transform', 'scale(' + str(buttonHeight) + ')');
  jx.position(leftWidth+middleWidth+rightWidth*5/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  jx.style('transform', 'scale(' + str(buttonHeight) + ')');
  jX.position(leftWidth+middleWidth+rightWidth*6.7/8-5,headerHeight+canvasHeight/2.3+leftWidth/5.5);
  jX.style('transform', 'scale(' + str(buttonHeight) + ')');
  jy.position(leftWidth+middleWidth+rightWidth*3/4-10,headerHeight+canvasHeight/2.2+leftWidth/3.8);
  jy.style('transform', 'scale(' + str(buttonHeight) + ')');

  DLabel.position(leftWidth+middleWidth+rightWidth/8,headerHeight+canvasHeight*4/5);
  gaitTypesw.position(leftWidth+middleWidth+rightWidth/4-17,headerHeight+canvasHeight*4/5);
  SLabel.position(leftWidth+middleWidth+rightWidth/8+rightWidth/4,headerHeight+canvasHeight*4/5);

  resetB.position(leftWidth+middleWidth+rightWidth/2+15,headerHeight+canvasHeight*3.5/5);
  jogB.position(leftWidth+middleWidth+rightWidth/2-25,headerHeight+canvasHeight*3.5/5);

  speedLabel.position(leftWidth+middleWidth+rightWidth/2-15,headerHeight+canvasHeight*3.8/5);
  speedSel.position(leftWidth+middleWidth+rightWidth/2-10,speedLabel.position().y+20);
  
  CLabel.position(leftWidth+middleWidth+rightWidth/8+rightWidth/2,headerHeight+canvasHeight*4/5);
  gaitShapesw.position(leftWidth+middleWidth+rightWidth*3/4-17,headerHeight+canvasHeight*4/5);
  SQLabel.position(leftWidth+middleWidth+rightWidth-rightWidth/8,headerHeight+canvasHeight*4/5);

  movesLabel.position(leftWidth+middleWidth+rightWidth*0.07,headerHeight+25+canvasHeight*5/6);
  movesSel.position(leftWidth+middleWidth+rightWidth*0.07,headerHeight+45+canvasHeight*5/6);

  ledLabel.position(leftWidth+middleWidth+rightWidth*3/4-20,headerHeight+25+canvasHeight*5/6);
  LEDsel.position(leftWidth+middleWidth+rightWidth*3/4-20,headerHeight+45+canvasHeight*5/6);
  
  seqButton.position(leftWidth+middleWidth+rightWidth-30,wHeight-footerHeight-30);
  
  // //Footer inputs
  // for(let i = 1; i < 6; i++){
  //   triggerMENU[i].position(leftWidth*0.07,headerHeight+canvasHeight+0.15*i*footerHeight);
  //   sequence[i].position(leftWidth*0.07+90,headerHeight+canvasHeight+0.15*i*footerHeight);
  //   for(let j = 0; j <= frameN; j++){
  //     frameIN[i][j].position(leftWidth*0.07+190+110*j,headerHeight+canvasHeight+0.15*i*footerHeight);
  //     frameMOD[i][j].position(leftWidth*0.07+260+110*j,headerHeight+canvasHeight+0.15*i*footerHeight);
  //   }
  // }
}

document.addEventListener('keydown', function(event) {
  if (keyFlag && !shouldHandleKeyDown) {
    switch (event.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        W.checked(true);
        forward();
        break;
      case 'a':
      case 'A':
        A.checked(true);
        left();
        break;
      case 'd':
      case 'D':
        D.checked(true);
        right();
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        S.checked(true);
        backward();
        break;   
      case 'e':
      case 'E':
      case 'ArrowRight':
        CW.value(1);
        rotateCW();
        break;
      case 'q':
      case 'Q':
      case 'ArrowLeft':
        CCW.value(1);
        rotateCCW();
        break;
      case 'r':
      case 'R':
        Yplus();
        robot.height(ctrlIK[1][1].slider.value());
        break;
      case 'f':
      case 'F':
        Yminus();
        robot.height(ctrlIK[1][1].slider.value());
        break;
      case 't':
      case 'T':
        console.log('Roll-')
        updateSliders(-1,0,0);
        robot.roll(ctrlIK[0][0].slider.value());
        break;
      case 'g':
      case 'G':
        console.log('Roll+')
        updateSliders(1,0,0);
        robot.roll(ctrlIK[0][0].slider.value());
        break;
      case 'y':
      case 'Y':
        console.log('Pitch-')
        updateSliders(-1,0,1);
        robot.pitch(ctrlIK[0][1].slider.value());

        break;
      case 'h':
      case 'H':
        console.log('Pitch+')
        updateSliders(1,0,1);
        robot.pitch(ctrlIK[0][1].slider.value());

        break;
      case 'u':
      case 'U':
        console.log('Yaw-')
        updateSliders(-1,0,2);
        robot.yaw(ctrlIK[0][2].slider.value());

        break;
      case 'j':
      case 'J':
        console.log('Yaw+')
        updateSliders(1,0,2);
        robot.yaw(ctrlIK[0][2].slider.value());

        break;
      case 'x':
      case 'X':
        movesSel.value('UP');
        key.value = 10;
        selectMoves();
        break;
      case 'z':
      case 'Z':
        movesSel.value('SIT');
        key.value = 11;
        selectMoves();
        break;
      case 'l':
      case 'L':
        movesSel.value('LAY');
        key.value = 12;
        selectMoves();
        break;
      case 'v':
      case 'V':
        movesSel.value('PAW');
        key.value = 13;
        selectMoves();
        break;
      case 'c':
      case 'C':
        movesSel.value('WIGGLE');
        key.value = 14;
        selectMoves();
        break;
      case 'b':
      case 'B':
        movesSel.value('TINKLE');
        key.value = 15;
        selectMoves();
        break;
    }
    shouldHandleKeyDown = true;
  }
});

document.addEventListener('keyup', function(event) {
  shouldHandleKeyDown = false;
  if (keyFlag){
    switch (event.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        W.checked(false);
        forward();
        break;
      case 'a':
      case 'A':
        A.checked(false);
        left();
        break;
      case 'd':
      case 'D':
        D.checked(false);
        right();
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        S.checked(false);
        backward();
        break;   
      case 'e':
      case 'E':
      case 'ArrowRight':
        CW.value(0);
        rotateCW();
        break;
      case 'q':
      case 'Q':
      case 'ArrowLeft':
        CCW.value(0);
        rotateCCW();
        break;
      default:
        break;
  }
  }
});

function draw(){
  drawMiddleCanvas();
  image(middleCanvas, -1/2*wWidth+leftWidth, -1/2*wHeight+headerHeight);
  drawLeftCanvas();
  drawRightCanvas();
  drawHeader();
  image(header, -1/2*wWidth, -1/2*wHeight);
  drawFooter();
}

function drawHeader(){
  noStroke();
  fill(57);
  rect(-1/2*wWidth, -1/2*wHeight, wWidth, headerHeight*0.65);
  fill(254,175,60);
  rect(-1/2*wWidth, -1/2*wHeight+headerHeight*0.65, wWidth, headerHeight*0.35);
  image(logo, -1/2*wWidth, -1/2*wHeight+0.1*headerHeight, 2.4*headerHeight, headerHeight);
  textFont(roboto);
  textSize(0.3*headerHeight);
  fill(255, 255, 255);
  text('mechDOG', 1/2*wWidth-1.7*headerHeight,-1/2*wHeight+0.5*headerHeight);
}

function drawLeftCanvas() {
  leftCanvas.background(125);
  image(leftCanvas, -1/2*wWidth, -1/2*wHeight+headerHeight);
  if (teachButton.button.value() == 1) getFeedback();
}

function drawMiddleCanvas(){
  if (robot.body.new_director_angle != robot.orientation(fbrl)){
    robot.updateAngle(robot.orientation(fbrl));
    if (comm.selected == COMport.WIFI) comm.send("#100M0V" + robot.orientation(fbrl) + "S" + speed + "\r");
  }
  robot.loop();
  if ((comm.selected != COMport.USB || robot.body.stopped) && !mobile){
    robotAnimations();
    opacity = true;
  }
  else if (opacity == true){
    addOpacity();
    opacity = false;
  }
}

function drawRightCanvas() {
  rightCanvas.background(125);
  image(rightCanvas, -1/2*wWidth+leftWidth+middleWidth, -1/2*wHeight+headerHeight);
  let joystickSize = (canvasHeight/5+leftWidth/2.3)/2;
  image(joystick1, -1/2*wWidth+leftWidth+middleWidth+rightWidth/4-joystickSize/2.3, -1/2*wHeight+headerHeight+canvasHeight/2.3,joystickSize,joystickSize);
  image(joystick2, -1/2*wWidth+leftWidth+middleWidth+rightWidth*3/4-joystickSize/2.1, -1/2*wHeight+headerHeight+canvasHeight/2.3-1,joystickSize,joystickSize);
  if (W.checked()){
    button.background('rgba(57,57,57,0.5)');
    image(button, -1/2*wWidth+leftWidth+middleWidth+rightWidth/4-5,-1/2*wHeight+headerHeight+canvasHeight/2.17);
    button.clear();
  }
  if (A.checked()){
    button.background('rgba(57,57,57,0.5)');
    image(button, -1/2*wWidth+leftWidth+middleWidth+rightWidth/8-5,-1/2*wHeight+headerHeight+canvasHeight/2.3+leftWidth/5.5);
    button.clear();
  }
  if (S.checked()){
    button.background('rgba(57,57,57,0.5)');
    image(button, -1/2*wWidth+leftWidth+middleWidth+rightWidth/4-5,-1/2*wHeight+headerHeight+canvasHeight/2.2+leftWidth/3.8);
    button.clear();
  }
  if (D.checked()){
    button.background('rgba(57,57,57,0.5)');
    image(button, -1/2*wWidth+leftWidth+middleWidth+rightWidth*2.9/8-5,-1/2*wHeight+headerHeight+canvasHeight/2.3+leftWidth/5.5);
    button.clear();
  }
}

function drawFooter(){
  footer.background(57);
  image(footer, -1/2*wWidth, 1/2*wHeight-footerHeight);
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;

export {robot, robotJoint, ctrlIK, comm, CW, CCW, speed, canvasHeight, middleWidth, wWidth, wHeight};
export {teachButton, haltButton, limpButton, caliButton, COMmenu, delayT, opacity};