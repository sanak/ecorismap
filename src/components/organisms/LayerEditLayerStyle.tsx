import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLOR, FEATURETYPE } from '../../constants/AppConstants';
import { Picker, PointView, LineView, PolygonView } from '../atoms';
import { t } from '../../i18n/config';

export const LayerStyle = (props: any) => {
  const { editable, layer, isNewLayer, editFeatureStyle, changeFeatureType } = props;

  const featureValueList = useMemo(() => Object.keys(FEATURETYPE), []);
  const featureValueLabels = useMemo(() => Object.values(FEATURETYPE), []);
  return (
    <View style={styles.tr}>
      <View style={styles.td}>
        <View style={styles.tr2}>
          <Text style={styles.title}>{t('common.style')}</Text>
          {layer.type !== 'NONE' && (
            <TouchableOpacity style={styles.td2} onPress={() => (editable ? editFeatureStyle() : null)}>
              {layer.type === 'POINT' && (
                <PointView size={20} borderColor={COLOR.WHITE} color={layer.colorStyle.color} />
              )}
              {layer.type === 'LINE' && <LineView color={layer.colorStyle.color} />}
              {layer.type === 'POLYGON' && <PolygonView color={layer.colorStyle.color} />}
              <MaterialIcons color={COLOR.GRAY4} style={styles.icon} size={25} name={'color-lens'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.td}>
        <Picker
          label={t('common.type')}
          enabled={isNewLayer && editable}
          selectedValue={layer.type}
          onValueChange={(itemValue) => (isNewLayer && editable ? changeFeatureType(itemValue) : null)}
          itemLabelArray={featureValueLabels}
          itemValueArray={featureValueList}
          maxIndex={featureValueList.length - 1}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    backgroundColor: COLOR.MAIN,
    padding: 0,
  },

  td: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLOR.GRAY2,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  td2: {
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  title: {
    color: COLOR.GRAY3,
    flex: 1,
    fontSize: 12,
  },
  tr: {
    flexDirection: 'row',
    height: 70,
  },
  tr2: {
    flex: 1,
    flexDirection: 'column',
    margin: 5,
  },
});
