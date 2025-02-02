import React from 'react';
import { View } from 'react-native';
import { COLOR } from '../../constants/AppConstants';
import { RecordType, LayerType } from '../../types';
import { PointView, PointLabel } from '../atoms';
import { Marker } from 'react-map-gl';
import { getColor } from '../../utils/Layer';
import dayjs from '../../i18n/dayjs';

interface Props {
  data: RecordType[];
  layer: LayerType;
  zoom: number;
  draggable: boolean;
  selectedRecord: { layerId: string; record: RecordType | undefined };
  onDragEndPoint: (e: any, layer: LayerType, feature: RecordType) => void;
  onPressPoint: (layer: LayerType, feature: RecordType) => void;
}

export const Point = React.memo((props: Props) => {
  //console.log('render Point');
  const { data, layer, zoom, draggable, selectedRecord, onDragEndPoint, onPressPoint } = props;
  if (data === undefined) return null;

  return (
    <>
      {data.map((feature) => {
        if (!feature.visible) return null;
        const label =
          layer.label === ''
            ? ''
            : feature.field[layer.label]
            ? layer.field.find((f) => f.name === layer.label)?.format === 'DATETIME'
              ? dayjs(feature.field[layer.label].toString()).format('L HH:mm')
              : feature.field[layer.label].toString()
            : '';

        const labelColor = getColor(layer, feature);
        const color =
          selectedRecord && selectedRecord.record !== undefined && feature.id === selectedRecord.record.id
            ? COLOR.YELLOW
            : labelColor;
        const borderColor =
          selectedRecord && selectedRecord.record !== undefined && feature.id === selectedRecord.record.id
            ? COLOR.BLACK
            : COLOR.WHITE;

        return (
          // @ts-ignore */
          <Marker
            key={`${feature.id}-${feature.redraw}`}
            {...feature.coords}
            offset={[-15 / 2, -15 / 2]}
            anchor={'top-left'}
            draggable={draggable}
            onDragEnd={(e) =>
              onDragEndPoint(
                { nativeEvent: { coordinate: { longitude: e.lngLat.lng, latitude: e.lngLat.lat } } },
                layer,
                feature
              )
            }
          >
            <div onClick={() => onPressPoint(layer, feature)}>
              <View style={{ alignItems: 'flex-start' }}>
                <PointView size={15} color={color} borderColor={borderColor} />
                <PointLabel label={zoom > 8 ? label : ''} size={15} color={labelColor} borderColor={COLOR.WHITE} />
              </View>
            </div>
          </Marker>
        );
      })}
    </>
  );
});
