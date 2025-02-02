import {
  DataType,
  DMSKey,
  FormatType,
  LatLonDMSKey,
  LatLonDMSType,
  LayerType,
  PhotoType,
  RecordType,
  UserType,
} from '../types';
import dayjs from '../i18n/dayjs';
import { formattedInputs } from './Format';
import { cloneDeep } from 'lodash';
import { isPoint, LatLonDMS } from './Coords';
import { t } from '../i18n/config';

export type SortOrderType = 'ASCENDING' | 'DESCENDING' | 'UNSORTED';

export const sortData = (data: RecordType[], fieldName: string, order: SortOrderType = 'UNSORTED') => {
  const dataWithIdx = data.map((d, idx) => ({ ...d, idx }));
  let idx = data.map((_, i) => i);
  if (data.length === 0 || order === 'UNSORTED') {
    return { data, idx };
  }
  let sortedDataWithIdx;
  if (fieldName === '_user_') {
    sortedDataWithIdx = [...dataWithIdx].sort((a, b) =>
      (a.displayName || '').toString().localeCompare((b.displayName || '').toString(), undefined, { numeric: true })
    );
  } else {
    if (data[0].field[fieldName] === undefined) {
      return { data, idx };
    }
    sortedDataWithIdx = [...dataWithIdx].sort((a, b) =>
      a.field[fieldName].toString().localeCompare(b.field[fieldName].toString(), undefined, { numeric: true })
    );
  }
  if (order === 'DESCENDING') {
    sortedDataWithIdx.reverse();
  }
  const sortedData: RecordType[] = sortedDataWithIdx.map(({ idx: _, ...d }) => d);
  idx = sortedDataWithIdx.map(({ idx: Idx }) => Idx);
  return { data: sortedData, idx };
};

export const getInitialFieldValue = (
  format: FormatType,
  list?: { value: string; isOther: boolean }[]
): string | number | PhotoType[] => {
  switch (format) {
    case 'STRING':
      return '';
    case 'LIST':
      return list === undefined || list[0] === undefined ? '' : list[0].value;
    case 'RADIO':
      return list === undefined || list[0] === undefined ? '' : list[0].value;
    case 'CHECK':
      return list === undefined || list[0] === undefined ? '' : list[0].value;
    case 'SERIAL':
      return 0;
    case 'INTEGER':
      return 0;
    case 'DECIMAL':
      return 0;
    case 'NUMBERRANGE':
      return `${t('common.ndash')}`;
    case 'DATETIME':
      return '1970-01-01T00:00:00+09:00';
    case 'DATESTRING':
      return '';
    case 'TIMESTRING':
      return '';
    case 'TIMERANGE':
      return `${t('common.ndash')}`;
    case 'TABLE':
      return '';
    case 'LISTTABLE':
      return '';
    case 'PHOTO':
      return [];
    default:
      return '';
  }
};

export const getDefaultFieldObject = (
  name: string,
  format: string,
  list: { value: string; isOther: boolean }[] | undefined,
  defaultValue: string | number | undefined,
  serial: number
) => {
  switch (format) {
    case 'STRING':
      return { [name]: defaultValue ?? '' };
    case 'SERIAL':
      return { [name]: serial };
    case 'INTEGER':
      return { [name]: defaultValue ?? 0 };
    case 'DECIMAL':
      return { [name]: defaultValue ?? 0 };
    case 'NUMBERRANGE':
      return { [name]: `${t('common.ndash')}` };
    case 'LIST':
      return { [name]: list![0].value };
    case 'RADIO':
      return { [name]: list![0].value };
    case 'CHECK':
      return { [name]: list![0].value };
    case 'DATETIME':
      return { [name]: dayjs().format() };
    case 'DATESTRING':
      return { [name]: defaultValue ?? dayjs().format('L') };
    case 'TIMESTRING':
      return { [name]: defaultValue ?? dayjs().format('HH:mm') };
    case 'TIMERANGE':
      return { [name]: `${dayjs().format('HH:mm')}${t('common.ndash')}${dayjs().format('HH:mm')}` };
    case 'PHOTO':
      return { [name]: [] };
    case 'TABLE':
      return { [name]: '' };
    case 'LISTTABLE':
      return { [name]: '' };
    default:
      return null;
  }
};

export const checkFieldInput = (layer: LayerType, record: RecordType) => {
  for (const l of layer.field) {
    //console.log(l.name, l.format, record.field[l.name]);
    const { isOK } = formattedInputs(record.field[l.name], l.format, false);
    if (!isOK) {
      return {
        isOK: false,
        message: `${t('Data.alert.checkFieldInput')} ${l.name}(${l.format}):${record.field[l.name]} `,
      };
    }
  }

  return { isOK: true, message: '' };
};

export const checkCoordsInput = (latlon: LatLonDMSType, isDecimal: boolean) => {
  if (isDecimal) {
    const dmsType = 'decimal';
    const latlonTypes: LatLonDMSKey[] = ['latitude', 'longitude'];
    for (const latlonType of latlonTypes) {
      const formatted = formattedInputs(latlon[latlonType][dmsType], `${latlonType}-${dmsType}`, false);
      if (!formatted.isOK) return false;
    }
  } else {
    const latlonTypes: LatLonDMSKey[] = ['latitude', 'longitude'];
    for (const latlonType of latlonTypes) {
      const dmsTypes: DMSKey[] = ['deg', 'min', 'sec'];
      for (const dmsType of dmsTypes) {
        const formatted = formattedInputs(latlon[latlonType][dmsType], `${latlonType}-${dmsType}`);
        if (!formatted.isOK) return false;
      }
    }
  }
  return true;
};

export const updateRecordCoords = (record: RecordType, latlon: LatLonDMSType, isDecimal: boolean) => {
  const updateRecord = cloneDeep(record);
  if (isPoint(updateRecord.coords)) {
    const latLonDms = LatLonDMS(latlon, isDecimal);
    updateRecord.coords.latitude = parseFloat(latLonDms.latitude.decimal);
    updateRecord.coords.longitude = parseFloat(latLonDms.longitude.decimal);
    return updateRecord;
  } else {
    return record;
  }
};

export const updateRecordPhoto = (record: RecordType, fieldName: string, index: number, uri: string) => {
  const updateRecord = cloneDeep(record);
  const photoField = updateRecord.field[fieldName] as PhotoType[];
  photoField[index].uri = uri;
  return updateRecord;
};

export const getTargetRecordSet = (dataSet: DataType[], layer: LayerType, user: UserType) => {
  //Commonの時は、全データが対象（アップロード後にCommonに変更した場合などもあるため）.Commonのデータをアップロードするのは管理者の場合のみ
  //PublicとPrivateの時は、自分のデータまたはundefine（プロジェクト作成時にログインしていない時に作成したデータをsaveでアップロードする場合）
  let targetDataSet: DataType | undefined;
  if (layer.permission === 'COMMON') {
    targetDataSet = dataSet.find((d) => d.layerId === layer.id);
  } else {
    targetDataSet = dataSet.find((d) => d.layerId === layer.id && (d.userId === undefined || d.userId === user.uid));
  }
  const recordSet: RecordType[] =
    targetDataSet !== undefined
      ? targetDataSet.data.map((d) => ({ ...d, userId: user.uid, displayName: user.displayName }))
      : [];
  return recordSet;
};

export const resetDataSetUser = (dataSet: DataType[]) => {
  const updatedDataSet: DataType[] = dataSet.map((data) => {
    const recordSet: RecordType[] = data.data.map((record) => ({ ...record, userId: undefined, displayName: null }));
    return { ...data, userId: undefined, data: recordSet };
  });
  return updatedDataSet;
};
