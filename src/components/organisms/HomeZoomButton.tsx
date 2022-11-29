import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HOME_BTN, COLOR } from '../../constants/AppConstants';

interface Props {
  zoom: number;
  top: number;
  left: number;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const HomeZoomButton = React.memo((props: Props) => {
  //console.log('render ZoomButton');
  const { zoom, top, left, zoomIn, zoomOut } = props;

  const styles = StyleSheet.create({
    buttonContainer: {
      alignItems: 'center',
      backgroundColor: COLOR.ALFABLUE2,
      borderRadius: 10,
      elevation: 100,
      height: 95,
      justifyContent: 'space-between',
      left: left,
      position: 'absolute',
      top: top,
      width: 36,
      zIndex: 100,
    },
  });

  return (
    <View style={styles.buttonContainer}>
      <MaterialCommunityIcons.Button
        //@ts-ignore
        backgroundColor={COLOR.ALFABLUE}
        borderRadius={10}
        //style={{ borderColor: COLOR.WHITE, borderWidth: 1 }}
        iconStyle={{ marginRight: 0 }}
        size={20}
        name={HOME_BTN.ZOOM_PLUS}
        onPress={zoomIn}
      />
      <Text style={{ fontSize: 12, color: COLOR.WHITE }}>{zoom.toString()}</Text>
      <MaterialCommunityIcons.Button
        //@ts-ignore
        backgroundColor={COLOR.ALFABLUE}
        borderRadius={10}
        //style={{ borderColor: COLOR.BLUE, borderWidth: 1 }}
        iconStyle={{ marginRight: 0 }}
        size={20}
        name={HOME_BTN.ZOOM_MINUS}
        onPress={zoomOut}
      />
    </View>
  );
});
