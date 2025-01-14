import React from 'react';
import { Text, Image, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Api, { getScaledValue } from '../Api';
import Icon from '../Icon';

const hasFocus = Api.formFactor === 'tv' && Api.platform !== 'tvos';

const styles = StyleSheet.create({
    button: {
        marginTop: getScaledValue(30),
        marginHorizontal: getScaledValue(20),
        borderWidth: getScaledValue(2),
        borderRadius: getScaledValue(25),
        borderColor: '#62DBFB',
        height: getScaledValue(50),
        minWidth: getScaledValue(150),
        maxWidth: getScaledValue(200),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    buttonText: {
        fontFamily: 'TimeBurner',
        color: '#62DBFB',
        fontSize: getScaledValue(20),
    },
});

const stylesStatic = {
  button: {
    width: getScaledValue(30),
    marginRight: getScaledValue(10),
  }
}

const parallax = {
    enabled: true,
    shiftDistanceY: 2,
    shiftDistanceX: 2,
    tiltAngle: 0.05,
    pressMagnification: 1,
    magnification: 1.1,
};

class Button extends React.Component {
    constructor() {
        super();
        this.state = { currentStyle: this.blurState };
    }

    blurState = {
        alpha: 1
    };

    focusState = {
        alpha: 0.4
    };

    render() {
        const { iconName, iconFont, iconColor, className, testID } = this.props;
        const hasIcon = iconName && iconFont;
        return (
            <TouchableOpacity
                testID={testID}
                tvParallaxProperties={parallax}
                className={className}
                style={[styles.button, this.props.style, this.state.currentStyle]}
                onPress={() => {
                    this.props.onPress();
                }}
                onFocus={() => {
                    if (hasFocus) this.setState({ currentStyle: this.focusState });
                }}
                onBlur={() => {
                    if (hasFocus) this.setState({ currentStyle: this.blurState });
                }}
            >
                {hasIcon ? (
                    <Icon iconFont={iconFont} iconName={iconName} iconColor={iconColor} style={stylesStatic.button} />
                ) : undefined}
                <Text style={styles.buttonText}>
                    {this.props.title}
                </Text>
            </TouchableOpacity>
        );
    }
}

export default Button;
