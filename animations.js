import {LSS_Robot_Model} from './IK_quad.js';
import {CCW, CW, speed, robot, robotJoint, canvasHeight, middleWidth, wWidth, wHeight} from './canvas.js';

let keyval = 0;	
let body, shoulder, knee, knee_right, knee_left, leg_right, leg_left;
var rotX = 0, rotY = 0;

export function updateModel(){
  switch(robot.body.model){
    case LSS_Robot_Model.DeskPet:
      body = loadModel("assets/models/deskpet/body.obj");
      shoulder = loadModel("assets/models/deskpet/shoulder.obj");
      knee = loadModel("assets/models/deskpet/shoulder-knee.obj");
      leg_right = loadModel("assets/models/deskpet/lower-leg-right.obj");
      leg_left = loadModel("../assets/models/deskpet/lower-leg-left.obj");
      robot.updateModel(LSS_Robot_Model.DeskPet);
      break;
    case LSS_Robot_Model.MechDog:
      body = loadModel("assets/models/mechdog/body.obj");
      shoulder = loadModel("assets/models/mechdog/leg-a.obj");
      knee_right = loadModel("assets/models/mechdog/leg-b.obj");
      knee_left = loadModel("assets/models/mechdog/leg-b2.obj");
      leg_right = loadModel("assets/models/mechdog/leg-c.obj");
      leg_left = loadModel('assets/models/mechdog/leg-c2.obj');
      robot.updateModel(LSS_Robot_Model.MechDog);
      break;
  }
}

function keyPressed() {
  if (keyCode == CONTROL) {
    keyval = 255;
  }
}

function keyReleased() {
  if (keyCode == CONTROL) {
    keyval = 0;
  }
}

function mousePressed() {
  if (mouseButton == CENTER) keyval = 255;
}

function mouseReleased() {
  if (keyval == 255) keyval = 0;
}

function mouseDragged(){
  if (keyval == 255){
    rotY -= (mouseX - pmouseX) * 0.01;
    rotX -= (mouseY - pmouseY) * 0.01;
  }
}

window.keyPressed = keyPressed;
window.keyReleased = keyReleased;
window.mousePressed = mousePressed;
window.mouseReleased = mouseReleased;
window.mouseDragged = mouseDragged;

export function robotAnimations(){
  push();
  background(150);
  smooth();
  lights();
  directionalLight(150, 150, 150, -1, 0, 1);

  noStroke();

  if (CCW.value() == 0) rotY = rotY - radians(speed/10);
  if (CW.value() == 0) rotY = rotY + radians(speed/10);

  rotateX(-rotX);
  rotateY(-rotY);

  fill(255);

  if(robot.body.model == LSS_Robot_Model.DeskPet){

    scale(-(canvasHeight+middleWidth)/(2*16));
    translate(0, canvasHeight/250, 0);
    
    let body_offw = 0.4;
    let body_length = 5.5;
    let shoulder_offw = 0.85;
    let shoulder_offh = 0.3;
    let shoulder_body_offw = 0.92;
    let knee_offw = 0.25;
    let knee_body_offw = 1.7;
    let knee_body_offl = 2.82;

    //BODY
    rotateY(radians(25));
    model(body);

    rotateY(radians(-90));
    translate(-body_offw, 0, body_length/2);

    //RIGHT REAR
    push();

    //ABDUCTION
    translate(shoulder_offw, -shoulder_offh, knee_body_offl);

    rotateX(radians(180));
    rotateZ(radians(-90 - robotJoint[0][0].slider.value()));

    translate(0, shoulder_body_offw, 0);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(0, knee_offw, 0.8);

    rotateY(radians(robotJoint[0][1].slider.value()));
    rotateZ(radians(-90));

    translate(knee_body_offw, -0.22, 3.5);

    fill(254,175,60);
    model(knee);

    //KNEE
    translate(-knee_body_offw, -0.6, -5.25);

    rotateX(radians(-95 - robotJoint[0][2].slider.value()));
    rotateY(radians(-90));

    translate(0.45, 1.17, -knee_offw);
    fill(125);
    model(leg_right);

    pop();

    //RIGHT FRONT
    push();

    //ABDUCTION
    translate(shoulder_offw, -shoulder_offh, -knee_body_offl);

    rotateZ(radians(-90 + robotJoint[1][0].slider.value()));

    translate(0, shoulder_body_offw, 0);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(0, knee_offw, 0.8);

    rotateY(radians(180 + robotJoint[1][1].slider.value()));
    rotateZ(radians(-90));

    translate(knee_body_offw, -0.22, 3.5);

    fill(254,175,60);
    model(knee);

    //KNEE
    translate(-knee_body_offw, -0.6, -5.25);

    rotateX(radians(-95 - robotJoint[1][2].slider.value()));
    rotateY(radians(-90));

    translate(0.45, 1.17, -knee_offw);
    fill(125);
    model(leg_right);

    pop();

    //LEFT REAR
    push();

    //ABDUCTION
    translate(-shoulder_offw, -shoulder_offh, knee_body_offl);

    rotateX(radians(180));
    rotateZ(radians(90 + robotJoint[2][0].slider.value()));

    translate(0, shoulder_body_offw, 0);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(0, knee_offw, 0.8);

    rotateY(radians(-220 - robotJoint[2][1].slider.value()));
    rotateZ(radians(-90));

    translate(knee_body_offw, 0.6, 5.25);

    fill(254,175,60);
    model(knee);

    //KNEE
    translate(-knee_body_offw, 0.22, -3.5);

    rotateX(radians(40 + robotJoint[2][2].slider.value()));
    rotateY(radians(-90));

    translate(knee_body_offw, 0.9, -0.8);
    fill(125);
    model(leg_left);

    pop();

    //LEFT FRONT
    push();
    
    //ABDUCTION
    translate(-shoulder_offw, -shoulder_offh, -knee_body_offl);

    rotateZ(radians(90 - robotJoint[3][0].slider.value()));

    translate(0, shoulder_body_offw, 0);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(0, knee_offw, 0.8);

    rotateY(radians(-45 - robotJoint[3][1].slider.value()));
    rotateZ(radians(-90));

    translate(knee_body_offw, 0.6, 5.25);

    fill(254,175,60);
    model(knee);

    //KNEE
    translate(-knee_body_offw, 0.22, -3.5);

    rotateX(radians(40 + robotJoint[3][2].slider.value()));
    rotateY(radians(-90));

    translate(knee_body_offw, 0.9, -0.8);
    fill(125);
    model(leg_left);

    pop();
  }

  if(robot.body.model == LSS_Robot_Model.MechDog){

    translate(robot.body.cgz,-robot.body.cgy,robot.body.cgx);

    scale((canvasHeight+middleWidth)/(2*650));
    translate(0, canvasHeight/10, 0);
    rotateY(radians(-30));

    rotateX(robot.body.pitch);
    rotateY(-robot.body.yaw);
    rotateZ(-robot.body.roll);

    //BODY
    model(body);

    //RIGHT REAR
    push();

    //ABDUCTION
    translate(-38, 27, -98);

    rotateZ(radians(180 + robotJoint[0][0].slider.value()));

    translate(-38, -27, -110);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(90, 27, 135);

    rotateX(radians(45 - robotJoint[0][1].slider.value()));
    
    translate(-90, -27, -135);

    fill(254,175,60);
    model(knee_right);

    //KNEE
    translate(90,-53,90);

    rotateX(radians(-95 - robotJoint[0][2].slider.value()));

    translate(-90,53,-90);

    fill(125);
    model(leg_right);

    pop();

    //RIGHT FRONT
    push();
    
    //ABDUCTION
    translate(-38, 27, 102);

    rotateZ(radians(180 + robotJoint[1][0].slider.value()));

    translate(-38, -27, -110);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(0, 27, 135);

    rotateX(radians(45 - robotJoint[1][1].slider.value()));
    
    translate(0, -27, -135);

    fill(254,175,60);
    model(knee_right);

    //KNEE
    translate(90,-53,90);

    rotateX(radians(-95 - robotJoint[1][2].slider.value()));

    translate(-90,53,-90);
    fill(125);
    model(leg_right);
    
    pop();

    //LEFT REAR
    push();

    //ABDUCTION
    translate(38, 27, -98);

    rotateZ(-radians(robotJoint[2][0].slider.value()));

    translate(-38, -27, -110);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(90, 27, 135);

    rotateZ(radians(-180));
    rotateX(radians(45 - robotJoint[2][1].slider.value()));
    
    translate(-90, -27, -135);

    fill(254,175,60);
    model(knee_left);

    //KNEE
    translate(90,-53,90);

    rotateX(radians(-95 - robotJoint[2][2].slider.value()));

    translate(-90,53,-90);

    fill(125);
    model(leg_left);

    pop();

    //LEFT FRONT
    push();
  
    //ABDUCTION
    translate(38, 27, 102);

    rotateZ(radians(-robotJoint[3][0].slider.value()));

    translate(-38, -27, -110);

    fill(200,90,0);
    model(shoulder);

    //ROTATION
    translate(90, 27, 135);
    
    rotateZ(radians(-180));
    rotateX(radians(45 - robotJoint[3][1].slider.value()));

    translate(-90, -27, -135);

    fill(254,175,60);
    model(knee_left);
    
    //KNEE
    translate(90,-53,90);

    rotateX(radians(-95 - robotJoint[3][2].slider.value()));

    translate(-90,53,-90);
    fill(125);
    model(leg_left);

    pop();
  }
  pop();
}

export function addOpacity(){
  console.log("Animation disabled while moving");
  push();
  translate(0,0,300);
  fill(150, 150, 150, 150);
  noStroke();
  rect(-1/2*wWidth, -1/2*wHeight, wWidth, wHeight);
  pop();
}