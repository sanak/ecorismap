import React, { useCallback } from 'react';
import { View, TouchableOpacity, Modal, Text, StyleSheet, useWindowDimensions, Linking } from 'react-native';
import { COLOR } from '../../constants/AppConstants';
import { TUTRIALS_MESSAGE } from '../../constants/Tutrials';
import { t } from '../../i18n/config';

interface Props {
  visible: boolean;
  pressOK: () => void;
  pressCancel: () => void;
}

export const HomeModalTermsOfUse = React.memo((props: Props) => {
  //console.log('render ModalTileMap');
  const { visible, pressOK, pressCancel } = props;

  const screenData = useWindowDimensions();
  const modalWidthScale = 0.7;

  const pressTermsOfUse = useCallback(() => {
    const url = t('site.termsOfUse');
    Linking.openURL(url);
  }, []);

  const styles = StyleSheet.create({
    input: {
      backgroundColor: COLOR.WHITE,
      borderColor: COLOR.GRAY1,
      borderWidth: 1,
      fontSize: 16,
      height: 40,
      paddingHorizontal: 12,
      width: screenData.width * modalWidthScale,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      marginTop: 10,
      width: screenData.width * modalWidthScale,
    },
    modalCenteredView: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    modalContents: {
      alignItems: 'center',
      width: screenData.width * modalWidthScale,
    },
    modalFrameView: {
      alignItems: 'center',
      backgroundColor: COLOR.WHITE,
      borderRadius: 20,
      elevation: 5,
      margin: 0,
      paddingHorizontal: 35,
      paddingVertical: 25,
      shadowColor: COLOR.BLACK,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalHeaderButton: {
      position: 'absolute',
      right: -20,
      top: -10,
    },
    modalOKCancelButton: {
      alignItems: 'center',
      backgroundColor: COLOR.GRAY1,
      borderRadius: 5,
      elevation: 2,
      height: 48,
      justifyContent: 'center',
      padding: 10,
      width: 80,
    },
    modalTextInput: {
      backgroundColor: COLOR.GRAY1,
      borderRadius: 5,
      height: 40,
      marginBottom: 10,
      paddingHorizontal: 5,
      width: screenData.width * modalWidthScale,
    },
    modalTitle: {
      fontSize: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    text: {
      color: COLOR.BLUE,
      fontSize: 16,
      textDecorationLine: 'underline',
    },
  });

  return (
    <Modal animationType="none" transparent={true} visible={visible}>
      <View style={styles.modalCenteredView}>
        <View style={styles.modalFrameView}>
          <View style={styles.modalContents}>
            <Text style={styles.modalTitle}>{t('common.confirm')} </Text>

            <View style={{ flexDirection: 'column', marginBottom: 10 }}>
              <Text>{TUTRIALS_MESSAGE.TERMS_OF_USE}</Text>
              <View style={{ alignItems: 'center', margin: 10 }}>
                <TouchableOpacity onPress={pressTermsOfUse}>
                  <Text style={styles.text}>{t('common.termsOfUse')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalOKCancelButton} onPress={pressOK}>
                <Text>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalOKCancelButton, { backgroundColor: COLOR.GRAY1 }]}
                onPress={pressCancel}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});
