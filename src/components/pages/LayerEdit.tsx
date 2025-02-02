import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';

import { LayerName } from '../organisms/LayerEditLayerName';
import { LayerStyle } from '../organisms/LayerEditLayerStyle';
import { LayerEditFieldTable, LayerEditFieldTitle } from '../organisms/LayerEditFieldTable';
import { LayerEditButton } from '../organisms/LayerEditButton';

import { FeatureType, FormatType, LayerType } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';

interface Props {
  layer: LayerType;
  isEdited: boolean;
  isNewLayer: boolean;
  editable: boolean;
  onChangeLayerName: (val: string) => void;
  submitLayerName: () => void;
  onChangeFeatureType: (itemValue: FeatureType) => void;
  onChangeFieldOrder: (index: number) => void;
  onChangeFieldName: (index: number, val: string) => void;
  submitFieldName: (index: number) => void;
  onChangeFieldFormat: (index: number, itemValue: FormatType) => void;
  pressSaveLayer: () => void;
  pressDeleteField: (id: number) => void;
  pressAddField: () => void;
  pressDeleteLayer: () => void;
  gotoLayerEditFeatureStyle: () => void;
  gotoLayerEditFieldItem: (fieldIndex: number, fieldItem: LayerType['field'][0]) => void;
  gotoBack: () => void;
}

export default function LayerEditScreen(props: Props) {
  //console.log('render LayerEdit');
  const {
    layer,
    isEdited,
    isNewLayer,
    editable,
    onChangeLayerName,
    submitLayerName,
    onChangeFeatureType,
    onChangeFieldOrder,
    onChangeFieldName,
    submitFieldName,
    onChangeFieldFormat,
    pressSaveLayer,
    pressDeleteField,
    pressAddField,
    pressDeleteLayer,
    gotoLayerEditFeatureStyle,
    gotoLayerEditFieldItem,
    gotoBack,
  } = props;
  const navigation = useNavigation();

  const headerLeftButton = useCallback(
    (props_: JSX.IntrinsicAttributes & HeaderBackButtonProps) => <HeaderBackButton {...props_} onPress={gotoBack} />,
    [gotoBack]
  );

  useEffect(() => {
    navigation.setOptions({
      headerLeft: (props_: JSX.IntrinsicAttributes & HeaderBackButtonProps) => headerLeftButton(props_),
    });
  }, [headerLeftButton, navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        data={[{}]}
        keyExtractor={() => ''}
        renderItem={() => (
          <>
            <LayerName
              value={layer.name}
              editable={editable}
              onChangeText={onChangeLayerName}
              onEndEditing={submitLayerName}
            />
            <LayerStyle
              editable={editable}
              layer={layer}
              isNewLayer={isNewLayer}
              editFeatureStyle={gotoLayerEditFeatureStyle}
              changeFeatureType={onChangeFeatureType}
            />
            <LayerEditFieldTitle editable={editable} addField={pressAddField} />
            <LayerEditFieldTable
              editable={editable}
              data={layer.field}
              changeFieldNameText={onChangeFieldName}
              submitFieldNameText={submitFieldName}
              changeFieldFormatValue={onChangeFieldFormat}
              editFieldListItem={gotoLayerEditFieldItem}
              deleteField={pressDeleteField}
              changeFieldOrder={onChangeFieldOrder}
            />
          </>
        )}
      />
      <LayerEditButton
        isEdited={isEdited}
        editable={editable}
        deleteLayer={pressDeleteLayer}
        pressSaveLayer={pressSaveLayer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
