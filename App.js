import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  Animated,
  StyleSheet,
  View,
  Dimensions,
  Easing,
  SafeAreaView
} from "react-native";
import { createResponder } from 'react-native-gesture-responder'
console.disableYellowBox = true;
const screenWidth = Dimensions.get("window").width

class DragerState {
  constructor(time, location) {
    this.time = time
    this.location = location
  }
}

const Drager = props => {
  const [firstState, setFirstState] = useState(new DragerState(new Date(), 0))
  const [secState, setSecondState] = useState(new DragerState(new Date(), 0))
  const [isSelected, setIsSelected] = useState(false)
  const [x, setX] = useState(new Animated.Value(40))


  useEffect(() => {

    const interval = setInterval(() => {
      if (new Date().getTime() - secState.time.getTime() > 100) {
        Animated.timing(
          props.acc,
          {
            toValue: 0,
            duration: 300,
            easing: Easing.linear
          }
        ).start()
      }
    }, 100)
    return () => clearInterval(interval)
  }, [secState])

  const Responder = useCallback(
    createResponder({
      onStartShouldSetResponder: () => true,
      onStartShouldSetResponderCapture: () => true,
      onMoveShouldSetResponder: () => true,
      onMoveShouldSetResponderCapture: () => true,
      onResponderMove: (evt, gestureState) => {
        pan(gestureState)
      },
      onResponderGrant: () => {
        setIsSelected(true)
      },
      onResponderRelease: () => {
        setIsSelected(false)
      },
      onPanResponderTerminationRequest: () => true,
    })
  )



  const pan = useCallback((gestureState) => {
    const maxX = screenWidth - 60
    const minX = 40
    const xDiff = gestureState.moveX - gestureState.previousMoveX
    let newX = x._value + xDiff

    if (newX < minX) {
      newX = minX
    } else if (newX > maxX) {
      newX = maxX
    }
    // Acceleration calculation
    if (Math.abs(secState.location - newX) >= 1) {
      if (secState.time.getTime() - firstState.time.getTime() !== 0) {
        const v1 = (secState.location - firstState.location) / (secState.time.getTime() - firstState.time.getTime())
        const v2 = (newX - secState.location) / (new Date().getTime() - secState.time.getTime())
        var a = Math.abs(v2 / v1)
        // Acceleration Scaling
        a = a < 0 ? 0 : a
        a = a > 5 ? 5 : a
        a = a * Math.abs((secState.location - firstState.location)) / 30
        if (props.acc._value < a) {
          // Positive acceleration
          Animated.timing(
            props.acc,
            {
              toValue: a,
              duration: 100,
              easing: Easing.linear
            }
          ).start()
        }
        else {
          // Negative acceleration
          Animated.timing(
            props.acc,
            {
              toValue: a,
              duration: 300,
              easing: Easing.linear
            }
          ).start()
        }
      }
    }
    setFirstState(secState)
    setSecondState(new DragerState(new Date(), newX))
    if (secState.location - firstState.location > 0)
      props.setIsLeftToRight(true)
    else
      props.setIsLeftToRight(false)
    props.setShowNumber(true)
    x.setValue(newX)
    props.updateFilled(newX - minX)
  })

  var dragerScale = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [20, 50],
  })

  var radius = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [10, 25],
  })

  var margin = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [0, -12.5],
  })

  const selectedDrager = {
    width: dragerScale,
    height: dragerScale,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: "#5030E3",
    backgroundColor: "#fff",
    marginLeft: margin
  }

  return (
    <Animated.View
      {...Responder}
      style={[{ left: x }, isSelected ? selectedDrager : styles.unSelectedDrager]} />
  )
}

const SliderLine = props => {
  return (
    <View style={styles.sliderLine}>
      <View style={{ ...styles.filledSliderLine, width: props.filled }} />
    </View>
  )
}

const Ballon = props => {
  const ballonStyle = {
    width: (props.number / 100) * 20 + 50,
    height: (props.number / 100) * 20 + 50,
    borderTopLeftRadius: (props.number / 100) * 20 + 25,
    borderTopRightRadius: (props.number / 100) * 20 + 25,
    borderBottomLeftRadius: (props.number / 100) * 20 + 25,
    borderBottomRightRadius: 4,
    backgroundColor: "#5030E3",
    rotation: 45,
    alignItems: 'center',
    justifyContent: 'center'
  }
  const ballonTail = {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#5030E3',
    marginTop: (props.number / 100 + 1) * 8
  }

  const rightRotation = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [0, 60],
  })

  const leftRotation = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [0, -60],
  })

  const leftMargin = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [0, 80],
  })

  const rightMargin = props.acc.interpolate({
    inputRange: [0, 5],
    outputRange: [0, -80],
  })

  return (
    <Animated.View style={{ position: 'absolute', bottom: '60%', left: 15 + (1 - props.number / 100) * 10 + props.left, alignItems: 'center', rotation: props.isLeftToRight ? leftRotation : rightRotation, marginLeft: props.isLeftToRight ? rightMargin : leftMargin }}>
      <View style={ballonStyle}>
        {props.showNumber ? <Text style={styles.ballonLabel}>{props.number}</Text> : null}
      </View>
      <View style={ballonTail} />
    </Animated.View>
  )
}

const BallonSlider = () => {
  const [filled, setFilled] = useState(0)
  const [showNumber, setShowNumber] = useState(false)
  const [acc, setAcc] = useState(new Animated.Value(0))
  const [isLeftToRight, setIsLeftToRight] = useState(false)

  return (
    <View style={styles.container}>
      <SliderLine filled={filled} />
      <Ballon left={filled} number={Number((filled / (screenWidth - 100)) * 100).toFixed(0)} showNumber={showNumber} acc={acc} isLeftToRight={isLeftToRight} />
      <View style={{ position: 'absolute', top: 0, width: '100%', height: '100%', justifyContent: 'center' }}>
        <Drager updateFilled={setFilled} setShowNumber={setShowNumber} acc={acc} setIsLeftToRight={setIsLeftToRight} />
      </View>
    </View>
  )
}


export default App = props => {
  return (
    <SafeAreaView style={{flex: 1 , justifyContent: 'center', alignItems: 'center'}}>
      <BallonSlider />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 280,
    justifyContent: "center",
    alignItems: "center"
  },
  sliderLine: {
    backgroundColor: '#bbb',
    width: screenWidth - 100,
    height: 2,
    borderRadius: 1,
  },
  filledSliderLine: {
    backgroundColor: "#5030E3",
    height: 2,
    borderRadius: 1,
    top: 0,
    left: 0
  },
  unSelectedDrager: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 6,
    borderColor: "#5030E3",
    backgroundColor: "#fff"
  },
  ballonLabel: {
    color: '#fff',
    fontSize: 18,
    rotation: -45,
    fontWeight: "bold",
  }
})
