/*
 *  Author:     Geraldine Barreto
 *  Version:    1.0
 *  Licence:    LGPL-3.0 (GNU Lesser General Public License)
 *  
 *  Description:  Control interface for quadruped robot  using processing & controlP5
 */

void settings() {
  size(displayWidth, displayHeight - 76, P3D);

  wWidth = displayWidth;
  wHeight = displayHeight - 76;
  
  dWidth = displayWidth;
  dHeight = displayHeight;
}

void setup() {
  canvasSize();
  
  logo = loadImage("data/logo.png");
  joystick = loadImage("data/joystick.png");
  roboto = createFont("data/roboto.ttf", int(buttonHeight/1.7));
  robotoTitle = createFont("data/roboto.ttf", int(buttonHeight*1.1));
  
  cp5 = new ControlP5(this);
  
  CColor c = new CColor();
  c.setBackground(color(0, 0, 0));
  
  cp5.addButtonBar("screensize")
    .setPosition(wWidth - 70, 10)
    .setSize(60, 20)
    .setColor(c)
    .setFont(roboto)
    .setColorForeground(0xffC85A00)
    .setColorActive(color(125, 125, 125))
    .addItems(split("S,M,L", ","))
    .setValue(2)
    .onChange(new CallbackListener() {
      public void controlEvent(CallbackEvent theEvent) {
        changeSize(int(cp5.getController("screensize").getValue()));
      }
    }
    );
    
  PImage[] info = {loadImage("data/info1.png"), loadImage("data/info2.png"), loadImage("data/info3.png")};
  infoButton = createButton("INFO", "", wWidth-62, headerHeight*0.33-10, buttonHeight, buttonHeight);
  infoButton.setImages(info);
  infoButton.setSwitch(true);
  infoButton.setOff();
  
  c.setBackground(color(57, 57, 57));
  
  textLabel = cp5.addTextlabel("label")
    .setText(labelMSG)
    .setPosition(leftWidth+buttonHeight, headerHeight+20)
    .setColorValue(255)
    .setFont(robotoTitle)
    .hide();

  int labcolor = color(0);
  int min = 0, max = 0;
  String label = "";

  //Left canvas inputs
  for (int i = 0; i <= 3; i++) {
    for (int j = 0; j <= 2; j++) {
      switch(j) {
      case 0:
        switch(i) {
        case 0:
          label = "RIGHT REAR";
          break;
        case 1:
          label = "RIGHT FRONT";
          break;
        case 2:
          label = "LEFT REAR";
          break;
        case 3:
          label = "LEFT FRONT";
          break;
        }
        createLabel(label, label, leftWidth*0.06, headerHeight+25+i*canvasHeight/5);

        labcolor = color(200, 90, 0);
        min = -30;
        max = 60;
        break;
      case 1:
        labcolor = color(254, 175, 60);
        min = -30;
        max = 100;
        break;
      case 2:
        labcolor = color(57, 57, 57);
        min = -200;
        max = 0;
        break;
      }

      final Integer inneri = i, innerj = j, innermin = min, innermax = max;

      cp5.addTextfield("i"+str(i+1)+str(j+1))
        .setPosition(leftWidth*(j*0.3+0.07), headerHeight+55+i*canvasHeight/5)
        .setSize(leftWidth/5, int(buttonHeight*0.8))
        .setFont(roboto)
        .setAutoClear(false)
        .setColorBackground(color(255))
        .setColor(labcolor)
        .setLabelVisible(false)
        .setText(str(float(min+(max-min)/2)))
        .setColorCaptionLabel(color(125))
        .onMove(new CallbackListener() {
          void controlEvent(CallbackEvent theEvent) {
              //Check min & max values
              float inputVal = float(cp5.get(Textfield.class, "i"+str(inneri+1)+str(innerj+1)).getText());
              if (inputVal < innermin) inputVal = innermin;
              else if (inputVal > innermax) inputVal = innermax;
              
              //Update inputs
              cp5.getController("s"+str(inneri+1)+str(innerj+1)).setValue(inputVal);
              cp5.get(Textfield.class, "i"+str(inneri+1)+str(innerj+1)).setText(str(inputVal));
              
              //Check if direction is inverted
              if (innerj > 0) inputVal = -inputVal;
              
              //Send command
              if (comm.selected != COMport.OFF){
                comm.send("#254FPC15\r");
                comm.send("#" + str(inneri+1) + str(innerj+1) + "D" + str(inputVal) + "\r");
              }
            }
        }
        );

      cp5.addSlider("s"+str(i+1)+str(j+1))
        .setPosition(leftWidth*(j*0.3+0.07), headerHeight+90+i*canvasHeight/5)
        .setSize(leftWidth/5, int(buttonHeight*0.55))
        .setRange(min, max)
        .setValue(min+(max-min)/2)
        .setLabelVisible(false)
        .setColorCaptionLabel(color(125))
        .setColorActive(0xff000000)
        .setColorForeground(labcolor)
        .setColorBackground(0xffffffff)
        .onDrag(new CallbackListener() {
          public void controlEvent(CallbackEvent theEvent) {
            //Update inputs
            cp5.get(Textfield.class, "i"+str(inneri+1)+str(innerj+1)).setText(nf(cp5.getController("s"+str(inneri+1)+str(innerj+1)).getValue(), 0, 1).replace(',', '.'));
            int angle = int(cp5.getController("s"+str(inneri+1)+str(innerj+1)).getValue()*10);
            
            //Check if direction is inverted
            if (innerj > 0) angle = -angle;
            
            //Send command
            if (comm.selected != COMport.OFF){
              comm.send("#254FPC15\r");
              comm.send("#" + str(inneri+1) + str(innerj+1) + "D" + str(angle) + "\r");
            }
          }
        }
        );
    }
  }
  
  createLabel("directCMD", "DIRECT COMMAND", leftWidth*0.06, headerHeight+25+canvasHeight*0.8);

  cp5.addTextfield("direct")
    .setPosition(leftWidth*0.07, headerHeight+55+canvasHeight*0.8)
    .setSize(int(leftWidth*0.63), int(buttonHeight*0.8))
    .setFont(roboto)
    .setAutoClear(false)
    .setColorBackground(color(255))
    .setColor(labcolor)
    .setLabelVisible(false)
    .setColorCaptionLabel(color(125))
    .setCaptionLabel("");
    
  sendButton = createButton("SEND", "SEND", leftWidth*0.64+buttonHeight, headerHeight+55+canvasHeight*0.8, 2*buttonHeight, int(buttonHeight*0.75));
  sendButton.setColor(c.setBackground(color(254, 175, 60)));
  sendButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      sendCMD();
    }
  });
  
  //Right canvas inputs
  for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 3; j++) {
      switch(j) {
      case 0:
        if (i == 0) {
          label = "ROLL";
          min = robot.body.roll_limits[0];
            max = robot.body.roll_limits[1];
        } else {
          label = "X";
          min = robot.body.cgx_limits[0];
            max = robot.body.cgx_limits[1];
        }
        labcolor = color(200, 90, 0);
        break;
      case 1:
        if (i == 0) {
          label = "PITCH";
          min = robot.body.pitch_limits[0];
            max = robot.body.pitch_limits[1];
        } else {
          label = "Y";
          min = robot.body.cgy_limits[0];
          max = robot.body.cgy_limits[1];
        }
        labcolor = color(254, 175, 60);
        break;
      case 2:
        if (i == 0) {
          label = "YAW";
          min = robot.body.yaw_limits[0];
          max = robot.body.yaw_limits[1];
        } else {
          label = "Z";
          min = robot.body.cgz_limits[0];
          max = robot.body.cgz_limits[1];
        }
        labcolor = color(57, 57, 57);
        break;
      }

      final String innerlabel = label;
      final int inneri = i, innerj = j;

      createLabel(label+"_label", label, leftWidth+middleWidth+rightWidth*(j*0.3+0.08), headerHeight+30+i*canvasHeight/5);

      cp5.addTextfield(label+"_input")
        .setPosition(leftWidth+middleWidth+rightWidth*(j*0.3+0.1), headerHeight+60+i*canvasHeight/5)
        .setSize(leftWidth/5, int(buttonHeight*0.8))
        .setFont(roboto)
        .setAutoClear(false)
        .setColorBackground(color(255))
        .setColor(color(200, 90, 0))
        .setLabelVisible(false)
        .setColorCaptionLabel(color(125))
        .onMove(new CallbackListener() {
          void controlEvent(CallbackEvent theEvent) {
            
            //Check min & max values
            float inputVal = float(cp5.get(Textfield.class, innerlabel+"_input").getText());
            if (inputVal < cp5.getController(innerlabel+"_slider").getMin()) inputVal = cp5.getController(innerlabel+"_slider").getMin();
            else if (inputVal > cp5.getController(innerlabel+"_slider").getMax()) inputVal = cp5.getController(innerlabel+"_slider").getMax();
            
            //If the value changed
            if (inputVal != cp5.getController(innerlabel+"_slider").getValue()){
              
              //Update inputs
              cp5.getController(innerlabel+"_slider").setValue(inputVal);
              cp5.get(Textfield.class, innerlabel+"_input").setText(str(inputVal));
              
              //Update animation
              switch(innerlabel){
                case "ROLL":
                  robot.roll(int(inputVal));
                  break;
                case "PITCH":
                  robot.pitch(int(inputVal));
                  break;
                case "YAW":
                  robot.yaw(int(inputVal));
                  break;
                case "X":
                  robot.frontalOffset(int(inputVal));
                  break;
                case "Y":
                  robot.height(int(inputVal));
                  break;
                case "Z":
                  robot.lateralOffset(int(inputVal));
                  break;
              }
            }
          }
        });

      cp5.addSlider(label+"_slider")
        .setPosition(leftWidth+middleWidth+rightWidth*(j*0.3+0.1), headerHeight+95+i*canvasHeight/5)
        .setSize(leftWidth/5, int(buttonHeight*0.55))
        .setRange(min, max)
        .setLabelVisible(false)
        .setColorCaptionLabel(color(125))
        .setColorActive(0xff000000)
        .setColorForeground(labcolor)
        .setColorBackground(0xffffffff)
        .onDrag(new CallbackListener() {
          public void controlEvent(CallbackEvent theEvent) {
            
            //Update inputs
            float value = cp5.getController(innerlabel+"_slider").getValue();
            cp5.get(Textfield.class, innerlabel+"_input").setText(nf(value, 0, 1).replace(',', '.'));
            int val =  parseInt(value);
            
            //Update animation
            switch(innerlabel){
              case "ROLL":
                robot.roll(val);
                break;
              case "PITCH":
                robot.pitch(val);
                break;
              case "YAW":
                robot.yaw(val);
                break;
              case "X":
                robot.frontalOffset(val);
                break;
              case "Y":
                robot.height(val);
                break;
              case "Z":
                robot.lateralOffset(val);
                break;
            }
          }
        });
    }
  }
  
  createLabel("W_label", "W", leftWidth+middleWidth+leftWidth*0.25-5, headerHeight+25+canvasHeight*0.4);
  W = createButton("W", "", leftWidth+middleWidth+leftWidth*0.25-8, cp5.getController("W_label").getPosition()[1]+22, buttonHeight, buttonHeight);
  W.setSwitch(true);
  W.setOff();
  W.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      forward();
    }
  }
  );
  
  createLabel("A_label", "A", leftWidth+middleWidth+leftWidth*0.125-25, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10);
  A = createButton("A", "", cp5.getController("A_label").getPosition()[0]+20, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10, buttonHeight, buttonHeight);
  A.setSwitch(true);
  A.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      left();
    }
  });
  
  createLabel("S_label", "S", leftWidth+middleWidth+leftWidth*0.25-4, headerHeight+25+canvasHeight*0.4+leftWidth*0.38);
  S = createButton("S", "", leftWidth+middleWidth+leftWidth*0.25-8, cp5.getController("S_label").getPosition()[1]-31, buttonHeight, buttonHeight);
  S.setSwitch(true);
  S.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      backward();
    }
  });
  
  createLabel("D_label", "D", cp5.getController("A_label").getPosition()[0]+leftWidth*0.33+12, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10);
  D = createButton("D", "", cp5.getController("D_label").getPosition()[0]-30, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10, buttonHeight, buttonHeight);
  D.setSwitch(true);
  D.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      right();
    }
  });
  
  PImage[] ccw = {loadImage("data/ccw1.png"), loadImage("data/ccw2.png"), loadImage("data/ccw2.png")};
  CCW = createButton("CCW", "", leftWidth+middleWidth+leftWidth*0.125-12, cp5.getController("W_label").getPosition()[1]-5, 30, 30);
  CCW.setImages(ccw);
  CCW.setSwitch(true);
  CCW.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      rotateCCW();
    }
  });
  
  PImage[] cw = {loadImage("data/cw1.png"), loadImage("data/cw2.png"), loadImage("data/cw2.png")};
  CW = createButton("CW", "", cp5.getController("D_label").getPosition()[0]-27, cp5.getController("W_label").getPosition()[1]-5, buttonHeight, buttonHeight);
  CW.setImages(cw);
  CW.setSwitch(true);
  CW.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      rotateCW();
    }
  });
  
  createLabel("jY_label", "+Y", leftWidth+middleWidth+leftWidth*0.75-5, cp5.getController("W_label").getPosition()[1]);
  jY = createButton("jY", "", leftWidth+middleWidth+leftWidth*0.75-8, cp5.getController("W_label").getPosition()[1]+22, buttonHeight, buttonHeight);
  jY.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      Yplus();
    }
  });
  
  createLabel("jy_label", "-Y", leftWidth+middleWidth+leftWidth*0.75-5, cp5.getController("S_label").getPosition()[1]);
  jy = createButton("jy", "", leftWidth+middleWidth+leftWidth*0.75-8, cp5.getController("S_label").getPosition()[1]-31, buttonHeight, buttonHeight);
  jy.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      Yminus();
    }
  });
  
  createLabel("jx_label", "-X", cp5.getController("D_label").getPosition()[0]+leftWidth*0.125-5, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10);
  jx = createButton("jx", "", cp5.getController("jx_label").getPosition()[0]+25, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10, buttonHeight, buttonHeight);
  jx.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      Xminus();
    }
  });
  
  createLabel("jX_label", "+X", cp5.getController("jx_label").getPosition()[0]+leftWidth*0.33+20, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10);
  jX = createButton("jX", "", cp5.getController("jX_label").getPosition()[0]-29, cp5.getController("W_label").getPosition()[1]+leftWidth*0.15+10, buttonHeight, buttonHeight);
  jX.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      Xplus();
   }
  });
  
  PImage[] left = {loadImage("data/left1.png"), loadImage("data/left2.png"), loadImage("data/left2.png")};
  leftButton = createButton("leftButton", "", cp5.getController("jx_label").getPosition()[0]+20, cp5.getController("W_label").getPosition()[1]-5, buttonHeight, buttonHeight);
  leftButton.setImages(left);
  leftButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      goLeft();
    }
  });
  
  PImage[] right = {loadImage("data/right1.png"), loadImage("data/right2.png"), loadImage("data/right2.png")};
  rightButton = createButton("rightButton", "", cp5.getController("jx_label").getPosition()[0]+leftWidth*0.33-7, cp5.getController("W_label").getPosition()[1]-5, buttonHeight, buttonHeight);
  rightButton.setImages(right);
  rightButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      goRight();
    }
  });
  
  cp5.addToggle("gaitType")
    .setPosition(cp5.getController("S_label").getPosition()[0]-buttonHeight*0.75, headerHeight+canvasHeight*0.78)
    .setSize(buttonHeight*2, int(buttonHeight*0.55))
    .setValue(true)
    .setLabelVisible(false)
    .setColorActive(color(200, 90, 0))
    .setColorBackground(0xffffffff)
    .setMode(ControlP5.SWITCH)
    .onChange(new CallbackListener() {
      public void controlEvent(CallbackEvent theEvent) {
         changeGait();  
      }
    });
  
  createLabel("gaitTypeD", "D", cp5.getController("gaitType").getPosition()[0]-22, headerHeight+canvasHeight*0.78-3);
  createLabel("gaitTypeS", "S", cp5.getController("gaitType").getPosition()[0]+buttonHeight*2+5, headerHeight+canvasHeight*0.78-3);

  jogButton = createButton("J", "J", cp5.getController("gaitTypeS").getPosition()[0]+buttonHeight*1.55-25, headerHeight+canvasHeight*0.66, buttonHeight, int(0.8*buttonHeight));
  jogButton.setColor(c.setBackground(color(57, 57, 57)));
  jogButton.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      jog();
    }
  });

  resetButton = createButton("R", "R",cp5.getController("gaitTypeS").getPosition()[0]+buttonHeight*1.55+25, headerHeight+canvasHeight*0.66, buttonHeight, int(0.8*buttonHeight));
  resetButton.setColor(c.setBackground(color(57, 57, 57)));
  resetButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      reset();
    }
  });
  
  createLabel("speedL", "SPEED", cp5.getController("gaitTypeS").getPosition()[0]+buttonHeight*1.55-15, headerHeight+canvasHeight*0.77-buttonHeight-5);
  createList("speedSel", rightWidth+middleWidth+leftWidth*0.5-12, headerHeight+canvasHeight*0.77, 30, 4*buttonHeight, Arrays.asList("1", "2", "3", "4"), 3);
  cp5.get(ScrollableList.class, "speedSel").setBarHeight(buttonHeight);
  cp5.get(ScrollableList.class, "speedSel").setItemHeight(buttonHeight);
  
  cp5.addToggle("gaitShape")
    .setPosition(cp5.getController("jy_label").getPosition()[0]-buttonHeight*0.75+5, headerHeight+canvasHeight*0.78)
    .setSize(buttonHeight*2, int(buttonHeight*0.55))
    .setValue(true)
    .setLabelVisible(false)
    .setColorActive(color(254, 175, 60))
    .setColorBackground(0xffffffff)
    .setMode(ControlP5.SWITCH)
    .onChange(new CallbackListener() {
      public void controlEvent(CallbackEvent theEvent) {
        changeTrajectory();
      }
    });
    
  createLabel("gaitShapeC", "C", cp5.getController("gaitShape").getPosition()[0]-22, headerHeight+canvasHeight*0.78-3);
  createLabel("gaitShapeS", "S", cp5.getController("gaitShape").getPosition()[0]+buttonHeight*2+5, headerHeight+canvasHeight*0.78-3);

  createLabel("movesL", "SPECIAL MOVES", leftWidth+middleWidth+rightWidth*0.11, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*1.5);
  createList("moves", leftWidth+middleWidth+rightWidth*0.12, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*2.5, 3*buttonHeight, 4*buttonHeight, Arrays.asList(" UP", " SIT", " LAY", " PAW", " WIGGLE", " TINKLE", " STRETCH"), 0);

  createLabel("labelLED", "LED COLOR", leftWidth+middleWidth+rightWidth*0.64, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*1.5);
  createList("LED", leftWidth+middleWidth+rightWidth*0.65, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*2.5, 3*buttonHeight, 4*buttonHeight, Arrays.asList(" OFF", " RED", " GREEN", " BLUE", " YELLOW", " CYAN", " PINK", " WHITE"), 2);
    
   cp5.addTextfield("IPaddress")
    .setPosition(wWidth/2-115, wHeight - footerHeight - 100)
    .setSize(240, int(buttonHeight*1.1))
    .setFont(robotoTitle)
    .setAutoClear(false)
    .setColorBackground(color(255))
    .setColor(color(0))
    .setLabelVisible(false)
    .setText("")
    .setColorCaptionLabel(color(150))
    .hide()
    .onMove(new CallbackListener() {
      void controlEvent(CallbackEvent theEvent) {
        comm.initWIFI();
      }
    });
  
  createList("COMmenu", wWidth*0.96-33, headerHeight*0.75-buttonHeight*0.2, 60, 4*buttonHeight, Arrays.asList(" OFF", " USB", " WIFI"), 0);
  createLabel("COM_label", "COM", wWidth*0.96-80, headerHeight*0.75-buttonHeight*0.2);

  createList("BAUDmenu", cp5.getController("COM_label").getPosition()[0]-40-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2, 80, 6*buttonHeight, Arrays.asList(" 9600", " 19200", " 38400", " 57600", " 115200"), 2);
  createLabel("BAUD_label", "BAUD", cp5.getController("COM_label").getPosition()[0]-93-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);

  PImage[] stop = {loadImage("data/stop1.png"), loadImage("data/stop2.png"), loadImage("data/stop3.png")};
  stopButton = createButton("STOP", "STOP", cp5.getController("BAUD_label").getPosition()[0]-50-wWidth*0.04, headerHeight-2*buttonHeight, 4*buttonHeight, 4*buttonHeight);
  stopButton.setImages(stop);
  stopButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      emergencySTOP();
    }
  });
  
  teachButton = createButton("TEACH", "TEACH", stopButton.getPosition()[0]-30-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2, 70, buttonHeight);
  teachButton.setColor(c);
  teachButton.setSwitch(true);
  teachButton.setOff();
  teachButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      teach();
    }
  });
  
  haltButton = createButton("HALT & HOLD", "HALT & HOLD", teachButton.getPosition()[0]-85-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2, 120, buttonHeight);
  haltButton.setColor(c);
  haltButton.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      halt();
    }
  });
  
  limpButton = createButton("LIMP", "LIMP", haltButton.getPosition()[0]-24-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2, 60, buttonHeight);
  limpButton.setColor(c);
  limpButton.setSwitch(true);
  limpButton.setOff();
  limpButton.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      limp();
    }
  });
  
  calibrateButton = createButton("CALIBRATE", "CALIBRATE", cp5.getController("LIMP").getPosition()[0]-65-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2, 100, buttonHeight);
  calibrateButton.setValue(0);
  calibrateButton.setColor(c);
  calibrateButton.setSwitch(true);
  calibrateButton.setOff();
  calibrateButton.onClick(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      calibration();
    }
  });
  
  createList("ROBOT", cp5.getController("CALIBRATE").getPosition()[0]-70-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2, 105, 3*buttonHeight, Arrays.asList(" DESKPET"," MECHDOG"), 1);
  cp5.getController("ROBOT").lock();
  
  hideButton = createButton("hideSeq", "^", wWidth-buttonHeight*1.3, wHeight-footerHeight-buttonHeight, int(0.8*buttonHeight), int(0.8*buttonHeight));
  hideButton.setColor(c.setBackground(color(57, 57, 57)));
  hideButton.setSwitch(true);
  hideButton.setOff();
  hideButton.onChange(new CallbackListener() {
    public void controlEvent(CallbackEvent theEvent) {
      //changeSize(int(cp5.getController("screensize").getValue()));
    }
  });
  
  infoBox = cp5.addTextarea("information")
    .setPosition(wWidth - 130, headerHeight*0.65)
    .setSize(150, 60)
    .setLineHeight(30)
    .setColor(color(57))
    .setColorBackground(color(255))
    .setFont(roboto)
    .bringToFront()
    .hide()
    .setText(" Wiki \n"
    +" Github \n"
    +" Community"
    );
  
  //Robot Model
  updateModelFiles(selectedRobot);
  reset();
}

void canvasSize() {
  if (wHeight >= 800) {
    headerHeight = int(0.15*wHeight);
    footerHeight = int(0.3*wHeight);
  } else {
    headerHeight = 90;
    footerHeight = 150;
  }
  
  if (hideButton == null || !hideButton.isOn()) footerHeight = 1;

  canvasHeight = wHeight - headerHeight - footerHeight;
  
  buttonHeight = int(headerHeight*0.2);
  if (buttonHeight < 25) buttonHeight = 25;

  //Establish min size for canvases
  if (wWidth >= 1000) {
    leftWidth = int(0.2*wWidth);
    middleWidth = int(0.6*wWidth);
    rightWidth = int(0.2*wWidth);
  } else {
    leftWidth = 200;
    middleWidth = wWidth - 400;
    rightWidth = 200;
  }

  //Set up the canvas images
  header = createGraphics(wWidth, headerHeight);
  leftCanvas = createGraphics(leftWidth, canvasHeight);
  middleCanvas = createGraphics(middleWidth, canvasHeight);
  rightCanvas = createGraphics(rightWidth, canvasHeight);
  footer = createGraphics(wWidth, footerHeight);
}

void changeSize(int n) {
  if (dWidth <= 1400) sizex = 0.05;
  switch (n){
    case 0:
      wWidth = int(dWidth*(0.8+sizex));
      wHeight = int(dHeight*(0.8+sizex));
      break;
    case 1:
      wWidth = int(dWidth*(0.9+sizex));
      wHeight = int(dHeight*(0.9+sizex));
      break;
    case 2:
      wWidth = int(dWidth);
      wHeight = int(dHeight - 76);
      break;
  }
  surface.setSize(wWidth, wHeight);
  canvasSize();
  
  //Update button positions
  cp5.getController("screensize").setPosition(wWidth - 70, 10);
  infoButton.setPosition(wWidth - 62, headerHeight*0.33-10);
  textLabel.setPosition(leftWidth+buttonHeight, headerHeight+20);
  cp5.getController("COMmenu").setPosition(wWidth*0.96-33, headerHeight*0.75-buttonHeight*0.2);
  cp5.getController("COM_label").setPosition(wWidth*0.96-80, headerHeight*0.75-buttonHeight*0.2);
  cp5.getController("BAUDmenu").setPosition(cp5.getController("COM_label").getPosition()[0]-40-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  cp5.getController("BAUD_label").setPosition(cp5.getController("COM_label").getPosition()[0]-93-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  stopButton.setPosition(cp5.getController("BAUD_label").getPosition()[0]-50-wWidth*0.04, headerHeight-2*buttonHeight);
  teachButton.setPosition(stopButton.getPosition()[0]-30-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  haltButton.setPosition(teachButton.getPosition()[0]-85-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  limpButton.setPosition(haltButton.getPosition()[0]-24-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  calibrateButton.setPosition(limpButton.getPosition()[0]-65-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  infoBox.setPosition(wWidth - 130, headerHeight*0.65);
  cp5.getController("ROBOT").setPosition(calibrateButton.getPosition()[0]-70-wWidth*0.04, headerHeight*0.75-buttonHeight*0.2);
  cp5.getController("directCMD").setPosition(leftWidth*0.06, headerHeight+25+canvasHeight*0.8);
  cp5.getController("direct").setPosition(leftWidth*0.07, headerHeight+55+canvasHeight*0.8);
  cp5.getController("direct").setSize(int(leftWidth*0.63), int(buttonHeight*0.8));
  sendButton.setPosition(leftWidth*0.64+buttonHeight, headerHeight+55+canvasHeight*0.8);
  sendButton.setSize(2*buttonHeight, int(buttonHeight*0.75));
  hideButton.setPosition(wWidth-buttonHeight*1.3, wHeight-footerHeight-buttonHeight);
  
  String label = "";
  //Left canvas inputs
  for (int i = 0; i <= 3; i++) {
    for (int j = 0; j <= 2; j++) {
      switch(j) {
      case 0:
        switch(i) {
        case 0:
          label = "RIGHT REAR";
          break;
        case 1:
          label = "RIGHT FRONT";
          break;
        case 2:
          label = "LEFT REAR";
          break;
        case 3:
          label = "LEFT FRONT";
          break;
        }
        cp5.getController(label).setPosition(leftWidth*0.06, headerHeight+25+i*canvasHeight/5);
      }
      cp5.getController("i"+str(i+1)+str(j+1)).setPosition(leftWidth*(j*0.3+0.07), headerHeight+55+i*canvasHeight*0.2);
      cp5.getController("s"+str(i+1)+str(j+1)).setPosition(leftWidth*(j*0.3+0.07), headerHeight+90+i*canvasHeight*0.2);
    }
  }
  
  //Right canvas inputs
  for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 3; j++) {
      switch(j) {
      case 0:
        if (i == 0) label = "ROLL";
        else label = "X";
        break;
      case 1:
        if (i == 0) label = "PITCH";
        else label = "Y";
        break;
      case 2:
        if (i == 0) label = "YAW";
        else label = "Z";
        break;
      }
      cp5.getController(label+"_label").setPosition(leftWidth+middleWidth+rightWidth*(j*0.3+0.08), headerHeight+30+i*canvasHeight*0.2);
      cp5.getController(label+"_input").setPosition(leftWidth+middleWidth+rightWidth*(j*0.3+0.1), headerHeight+60+i*canvasHeight*0.2);
      cp5.getController(label+"_slider").setPosition(leftWidth+middleWidth+rightWidth*(j*0.3+0.1), headerHeight+95+i*canvasHeight*0.2);
    }
  }

  //Update button positions
  cp5.getController("W_label").setPosition(leftWidth+middleWidth+leftWidth*0.25-5, headerHeight+25+canvasHeight*0.4);
  W.setPosition(leftWidth+middleWidth+leftWidth*0.25-8, cp5.getController("W_label").getPosition()[1]+22);
  CCW.setPosition(leftWidth+middleWidth+leftWidth*0.125-12, cp5.getController("W_label").getPosition()[1]-5);
  cp5.getController("A_label").setPosition(leftWidth+middleWidth+leftWidth*0.125-25, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  A.setPosition(cp5.getController("A_label").getPosition()[0]+19, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  cp5.getController("D_label").setPosition(cp5.getController("A_label").getPosition()[0]+leftWidth*0.33+12, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  D.setPosition(cp5.getController("D_label").getPosition()[0]-29, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  CW.setPosition(cp5.getController("D_label").getPosition()[0]-27, cp5.getController("W_label").getPosition()[1]-5);
  cp5.getController("S_label").setPosition(leftWidth+middleWidth+leftWidth*0.25-5, headerHeight+25+canvasHeight*0.4+leftWidth*0.38);
  S.setPosition(leftWidth+middleWidth+leftWidth*0.25-8, cp5.getController("S_label").getPosition()[1]-31);
  cp5.getController("jY_label").setPosition(leftWidth+middleWidth+leftWidth*0.75-5, cp5.getController("W_label").getPosition()[1]);
  jY.setPosition(leftWidth+middleWidth+leftWidth*0.75-8, cp5.getController("W_label").getPosition()[1]+22);
  cp5.getController("jx_label").setPosition(cp5.getController("D_label").getPosition()[0]+leftWidth*0.125-5, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  jx.setPosition(cp5.getController("jx_label").getPosition()[0]+25, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  leftButton.setPosition(cp5.getController("jx_label").getPosition()[0]+20, cp5.getController("W_label").getPosition()[1]-5);
  cp5.getController("jX_label").setPosition(cp5.getController("jx_label").getPosition()[0]+leftWidth*0.33+20, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  jX.setPosition(cp5.getController("jX_label").getPosition()[0]-28, cp5.getController("W_label").getPosition()[1]+leftWidth*0.16+10);
  rightButton.setPosition(cp5.getController("jx_label").getPosition()[0]+leftWidth*0.33-7, cp5.getController("W_label").getPosition()[1]-5);
  cp5.getController("jy_label").setPosition(leftWidth+middleWidth+leftWidth*0.75-5, cp5.getController("S_label").getPosition()[1]);
  jy.setPosition(leftWidth+middleWidth+leftWidth*0.75-8, cp5.getController("S_label").getPosition()[1]-31);
  cp5.getController("gaitType").setPosition(cp5.getController("S_label").getPosition()[0]-buttonHeight*0.75, headerHeight+canvasHeight*0.78);
  cp5.getController("gaitType").setSize(buttonHeight*2, int(buttonHeight*0.55));
  cp5.getController("gaitTypeD").setPosition(cp5.getController("gaitType").getPosition()[0]-22, headerHeight+canvasHeight*0.78-3);
  cp5.getController("gaitTypeS").setPosition(cp5.getController("gaitType").getPosition()[0]+buttonHeight*2+5, headerHeight+canvasHeight*0.78-3);
  cp5.getController("gaitShape").setPosition(cp5.getController("jy_label").getPosition()[0]-buttonHeight*0.75+5, headerHeight+canvasHeight*0.78);
  cp5.getController("gaitShape").setSize(buttonHeight*2, int(buttonHeight*0.55));
  cp5.getController("gaitShapeC").setPosition(cp5.getController("gaitShape").getPosition()[0]-22, headerHeight+canvasHeight*0.78-3);
  cp5.getController("gaitShapeS").setPosition(cp5.getController("gaitShape").getPosition()[0]+buttonHeight*2+5, headerHeight+canvasHeight*0.78-3);
  jogButton.setPosition(cp5.getController("gaitTypeS").getPosition()[0]+buttonHeight*1.55-25, headerHeight+canvasHeight*0.66);
  jogButton.setSize(buttonHeight, int(0.8*buttonHeight));
  resetButton.setPosition(cp5.getController("gaitTypeS").getPosition()[0]+buttonHeight*1.55+25, headerHeight+canvasHeight*0.66);
  resetButton.setSize(buttonHeight, int(0.8*buttonHeight));
  cp5.getController("speedL").setPosition(cp5.getController("gaitTypeS").getPosition()[0]+buttonHeight*1.55-15, headerHeight+canvasHeight*0.77-buttonHeight-5);
  cp5.get(ScrollableList.class, "speedSel").setPosition(rightWidth+middleWidth+leftWidth*0.5-12, headerHeight+canvasHeight*0.77);
  cp5.getController("movesL").setPosition(leftWidth+middleWidth+rightWidth*0.11, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*1.5);
  cp5.get(ScrollableList.class, "moves").setPosition(leftWidth+middleWidth+rightWidth*0.12, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*2.5);
  cp5.getController("labelLED").setPosition(leftWidth+middleWidth+rightWidth*0.64, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*1.5);
  cp5.get(ScrollableList.class, "LED").setPosition(leftWidth+middleWidth+rightWidth*0.65, cp5.getController("gaitShapeC").getPosition()[1]+buttonHeight*2.5);
}

void draw() {
  //Adjust window position
  if (!frameLocation) {
    surface.setLocation(0, 0);
    frameLocation = true;
  }
  
  // Counter for interface message
  if (labeltime.getDT(false)) showLabel = false;
  
  middleCanvas.beginDraw();
  drawMiddleCanvas();
  image(middleCanvas, -0.5*wWidth+leftWidth, -0.5*wHeight+headerHeight);
  middleCanvas.endDraw();
  
  leftCanvas.beginDraw();
  drawLeftCanvas();
  image(leftCanvas, -1/2*wWidth, -1/2*wHeight+headerHeight);
  leftCanvas.endDraw();
  
  rightCanvas.beginDraw();
  drawRightCanvas();
  image(rightCanvas, -1/2*wWidth+leftWidth+middleWidth, -1/2*wHeight+headerHeight);
  image(joystick, leftWidth+middleWidth+leftWidth/10, headerHeight+25+canvasHeight*2/5+20, leftWidth/3, leftWidth/3);
  image(joystick, leftWidth+middleWidth+leftWidth/10+leftWidth/2, headerHeight+25+canvasHeight*2/5+20, leftWidth/3, leftWidth/3);
  rightCanvas.endDraw();
  
  header.beginDraw();
  drawHeader();
  image(header, -1/2*wWidth, -1/2*wHeight);
  header.endDraw();

  footer.beginDraw();
  drawFooter();
  image(footer, 0, wHeight-footerHeight);
  footer.endDraw();
}

void drawHeader() {
  push();
  noStroke();
  fill(57);
  rect(-1/2*wWidth, -1/2*wHeight, wWidth, headerHeight*0.65);
  fill(254, 175, 60);
  rect(-1/2*wWidth, -1/2*wHeight+headerHeight*0.65, wWidth, headerHeight*0.35);
  pop();
  fill(255);
  textFont(robotoTitle);
  text("mechDOG", wWidth-220, 0.5*headerHeight);
  image(logo, -1/2*wWidth, -1/2*wHeight+0.1*headerHeight, 2.4*headerHeight, headerHeight);
}

void drawLeftCanvas() {
  leftCanvas.background(125);
  if (teachButton.isOn()) thread("getFeedback");
}

void drawMiddleCanvas() {
  if (showLabel) {
    textLabel.setText(labelMSG);
    textLabel.show();
  } else textLabel.hide();
  
  if (infoButton.isOn()) infoBox.show();
  else infoBox.hide();
  
  thread("moveRobot");
  if (comm.selected != COMport.USB || robot.body.stopped){
    robotAnimations(selectedRobot);
    opacity = false;
  }
  else if (opacity == false) addOpacity();
}

void drawRightCanvas() {
  rightCanvas.background(125);
}

void drawFooter() {
  footer.background(57);
}

void moveRobot(){
  if (robot.body.new_director_angle != robot.orientation(fbrl)){
    robot.updateAngle(robot.orientation(fbrl));
    if (comm.selected == COMport.WIFI) comm.send("#100M0V" + str(robot.orientation(fbrl)) + "S" + robot.speed + "\r");
  }
  robot.loop();
}

void exit() {
   comm.turnOFF("Goodbye"); 
   super.exit();
}
