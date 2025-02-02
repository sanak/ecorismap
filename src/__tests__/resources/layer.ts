import { COLOR } from '../../constants/AppConstants';
import { LayerType } from '../../types';

export const layers: LayerType[] = [
  {
    id: '0',
    name: 'ポイント',
    type: 'POINT',
    permission: 'PRIVATE',
    colorStyle: {
      colorType: 'SINGLE',
      color: COLOR.RED,
      fieldName: 'name',
      colorRamp: 'RANDOM',
      colorList: [],
      transparency: 1,
    },
    label: 'name',
    visible: true,
    active: true,
    field: [
      { id: '0-0', name: 'name', format: 'SERIAL' },
      { id: '0-1', name: 'time', format: 'DATETIME' },
      { id: '0-2', name: 'cmt', format: 'STRING' },
      { id: '0-3', name: 'photo', format: 'PHOTO' },
    ],
  },
  {
    id: '1',
    name: 'トラック',
    type: 'LINE',
    permission: 'PRIVATE',
    colorStyle: {
      colorType: 'SINGLE',
      color: COLOR.RED,
      fieldName: 'name',
      colorRamp: 'RANDOM',
      colorList: [],
      transparency: 1,
    },
    label: 'name',
    visible: true,
    active: true,
    field: [
      { id: '1-0', name: 'name', format: 'SERIAL' },
      { id: '1-1', name: 'time', format: 'DATETIME' },
      { id: '1-2', name: 'cmt', format: 'STRING' },
    ],
  },
  {
    id: '2',
    name: 'ポリゴン',
    type: 'POLYGON',
    permission: 'PRIVATE',
    colorStyle: {
      colorType: 'SINGLE',
      color: COLOR.RED,
      fieldName: 'name',
      colorRamp: 'RANDOM',
      colorList: [],
      transparency: 1,
    },
    label: 'name',
    visible: true,
    active: true,
    field: [
      { id: '2-0', name: 'name', format: 'SERIAL' },
      { id: '2-1', name: 'time', format: 'DATETIME' },
      { id: '2-2', name: 'cmt', format: 'STRING' },
    ],
  },
];
