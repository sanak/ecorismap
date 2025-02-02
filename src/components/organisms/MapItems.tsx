import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, FlatList } from 'react-native';
import { COLOR } from '../../constants/AppConstants';

import { SmallButton, RectButton2, RadioButton } from '../atoms';
import { TileMapType } from '../../types';

interface Props {
  tileMap: TileMapType[];
  changeMapOrder: (index: number) => void;
  changeVisible: (visible: boolean, index: number) => void;
  downloadTileMap: (item: TileMapType) => void;
  showModalTileMap: (item: TileMapType) => void;
}

export const MapItems = React.memo((props: Props) => {
  const { tileMap, changeMapOrder, changeVisible, downloadTileMap, showModalTileMap } = props;

  return (
    <FlatList
      style={{ borderTopWidth: 1, borderColor: COLOR.GRAY2 }}
      data={tileMap}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <View style={styles.tr}>
          <TouchableOpacity style={[styles.td, { flex: 6 }]} onPress={() => changeVisible(!item.visible, index!)}>
            <View style={[styles.td2, { flex: 2 }]}>
              <RadioButton checked={item.visible} />
            </View>
            <View style={[styles.td2, { flex: 4, justifyContent: 'flex-start' }]}>
              <Text>{item.name}</Text>
            </View>
          </TouchableOpacity>
          {/*************** Edit Button ************************************* */}
          <View style={[styles.td, { flex: 1 }]}>
            {item.id !== 'standard' && item.id !== 'hybrid' && (
              <SmallButton name="pencil" onPress={() => showModalTileMap(item)} backgroundColor={COLOR.BLUE} />
            )}
          </View>
          {/*************** Download Button ************************************* */}
          <View style={[styles.td, { flex: 1 }]}>
            {item.id !== 'standard' && item.id !== 'hybrid' && Platform.OS !== 'web' && (
              <SmallButton
                name="download"
                onPress={() => downloadTileMap(item)}
                borderRadius={5}
                backgroundColor={COLOR.GRAY3}
              />
            )}
          </View>

          <View style={[styles.td, { flex: 1 }]}>
            <RectButton2 name="chevron-double-up" onPress={() => changeMapOrder(index)} color={COLOR.GRAY2} />
          </View>
        </View>
      )}
    />
  );
});

const styles = StyleSheet.create({
  td: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLOR.GRAY2,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
    //borderRightWidth: 1,
  },
  td2: {
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  tr: {
    flexDirection: 'row',
    height: 60,
  },
});
