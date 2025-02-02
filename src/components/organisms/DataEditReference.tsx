import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { COLOR } from '../../constants/AppConstants';
import { useData } from '../../hooks/useData';
import { LayerType, PhotoType, RecordType } from '../../types';
import dayjs from '../../i18n/dayjs';
import { Button } from '../atoms';
import { Alert } from '../atoms/Alert';

interface Props {
  name: string;
  layer: LayerType;
  dataId: string;
  isEditingRecord: boolean;
  onPress: (referenceData: RecordType, referenceLayer: LayerType) => void;
  pressAddReferenceData: (referenceData: RecordType | undefined, referenceLayer: LayerType, message: string) => void;
}

export const DataEditReference = (props: Props) => {
  const { name, layer, dataId, isEditingRecord, onPress, pressAddReferenceData } = props;
  const { allUserRecordSet, addRecord } = useData(layer);

  const data = useMemo(
    () => allUserRecordSet.filter((d) => d.field._ReferenceDataId === dataId),
    [allUserRecordSet, dataId]
  );

  const addReferenceData = useCallback(
    async (referenceLayer: LayerType) => {
      if (isEditingRecord) {
        Alert.alert('', '一旦変更を保存してください。');
        return;
      }
      const { message, data: referenceData } = await addRecord(dataId);
      pressAddReferenceData(referenceData, referenceLayer, message);
    },
    [addRecord, dataId, isEditingRecord, pressAddReferenceData]
  );

  return (
    <View style={{ flexDirection: 'column', flex: 1 }}>
      <View style={styles.tr3}>
        <View style={{ margin: 5, flex: 100, paddingHorizontal: 10 }}>
          <Text style={styles.title}>{name}</Text>
        </View>
        <View style={[styles.td3, { minWidth: 40, justifyContent: 'flex-end' }]}>
          <Button
            style={{
              backgroundColor: COLOR.GRAY3,
              padding: 0,
            }}
            name="plus"
            onPress={() => addReferenceData(layer)}
          />
        </View>
      </View>
      <DataTitle layer={layer} />
      <DataItems data={data} layer={layer} onPress={(index: number) => onPress(data[index], layer)} />
    </View>
  );
};

interface Props_DataTitle {
  layer: LayerType;
}
const DataTitle = React.memo((props: Props_DataTitle) => {
  const { layer } = props;

  return (
    <View style={{ flexDirection: 'row', height: 45 }}>
      {layer.field.map(({ name }, field_index) => (
        <View key={field_index} style={[styles.th, { flex: 2, width: 120 }]}>
          <Text>{name}</Text>
        </View>
      ))}
    </View>
  );
});

interface Props_DataTableComponent {
  item: RecordType;
  index: number;
  layer: LayerType;
  onPress: (index: number) => void;
}

const DataTableComponent = React.memo(({ item, index, layer, onPress }: Props_DataTableComponent) => {
  //console.log('render renderItems');
  return (
    <View style={{ flex: 1, height: 45, flexDirection: 'row' }}>
      {layer.field.map(({ name, format }, field_index) => (
        <TouchableOpacity key={field_index} style={[styles.td, { flex: 2, width: 120 }]} onPress={() => onPress(index)}>
          <Text adjustsFontSizeToFit={true} numberOfLines={2}>
            {format === 'DATETIME' && item.field[name] !== ''
              ? dayjs(item.field[name] as string).format('L HH:mm')
              : format === 'PHOTO'
              ? `${(item.field[name] as PhotoType[]).length} pic`
              : item.field[name]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

interface Props_DataItems {
  data: RecordType[];
  layer: LayerType;
  onPress: (index: number) => void;
}

const DataItems = React.memo((props: Props_DataItems) => {
  const { data, layer, onPress } = props;
  //@ts-ignore
  const renderItem = useCallback(
    ({ item, index }) => <DataTableComponent {...{ item, index, layer, onPress }} />,
    [layer, onPress]
  );
  const keyExtractor = useCallback((item) => item.id, []);
  return <FlatList data={data} extraData={data} renderItem={renderItem} keyExtractor={keyExtractor} />;
});

const styles = StyleSheet.create({
  td: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLOR.GRAY2,
    //flex: 1,
    //flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
    //borderRightWidth: 1,
  },
  td3: {
    alignItems: 'center',
    borderColor: COLOR.GRAY2,
    //borderTopWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  th: {
    alignItems: 'center',
    backgroundColor: COLOR.GRAY1,
    borderColor: COLOR.GRAY2,
    borderRightWidth: 1,
    //flex: 1,
    // flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  title: {
    color: COLOR.GRAY3,
    flex: 1,
    fontSize: 12,
  },
  tr3: {
    //backgroundColor: COLOR.GRAY1,
    //borderColor: COLOR.GRAY1,
    //borderWidth: 1,
    flexDirection: 'row',
    height: 30,
  },
});
