import { useDispatch, useSelector } from 'react-redux';
import {
  DMSKey,
  LatLonDMSKey,
  LatLonDMSType,
  LayerType,
  LocationType,
  PhotoType,
  RecordType,
  SelectedPhotoType,
} from '../types';
import { AppState } from '../modules';
import { deleteRecordsAction, updateRecordsAction } from '../modules/dataSet';
import { v4 as uuidv4 } from 'uuid';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { LatLonDMSTemplate, PHOTO_FOLDER, SelectedPhotoTemplate } from '../constants/AppConstants';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { cloneDeep } from 'lodash';
import { LatLonDMS, toLatLonDMS } from '../utils/Coords';
import { formattedInputs } from '../utils/Format';
import * as FileSystem from 'expo-file-system';
import { checkCoordsInput, checkFieldInput, updateRecordCoords } from '../utils/Data';
import { editSettingsAction } from '../modules/settings';
import dayjs from '../i18n/dayjs';
import { usePhoto } from './usePhoto';
import { t } from '../i18n/config';
// let fs: any;
// if (Platform.OS === 'web') {
//   fs = require('fs');
// }
export type UseDataEditReturnType = {
  targetRecord: RecordType;
  targetLayer: LayerType;
  targetRecordSet: RecordType[] | undefined;
  latlon: LatLonDMSType;
  selectedPhoto: SelectedPhotoType;
  isEditingRecord: boolean;
  isDecimal: boolean;
  recordNumber: number;
  setRecordNumber: Dispatch<SetStateAction<number>>;
  changeRecord: (newRecord: RecordType) => void;
  saveData: () => {
    isOK: boolean;
    message: string;
  };
  pickImage: (name: string) => Promise<void>;
  takePhoto: (name: string) => Promise<void>;
  removeSelectedPhoto: () => Promise<void>;

  setPhoto: (fieldName: string, photo: PhotoType, index: number) => void;
  deleteRecord: () => {
    isOK: boolean;
    message: string;
  };
  changeLatLonType: () => void;
  changeField: (name: string, value: string) => void;
  submitField: (name: string, format: string) => void;
  changeLatLon: (val: string, latlonType: LatLonDMSKey, dmsType: DMSKey) => void;
  cancelUpdate: () => void;
};

export const useDataEdit = (
  record: RecordType,
  layer: LayerType,
  recordSet: RecordType[] | undefined
): UseDataEditReturnType => {
  const dispatch = useDispatch();
  const projectId = useSelector((state: AppState) => state.settings.projectId);
  const user = useSelector((state: AppState) => state.user);
  const dataUser = useMemo(
    () => (projectId === undefined ? { ...user, uid: undefined, displayName: null } : user),
    [projectId, user]
  );

  const tracking = useSelector((state: AppState) => state.settings.tracking);
  const drawTools = useSelector((state: AppState) => state.settings.drawTools);
  const isEditingRecord = useSelector((state: AppState) => state.settings.isEditingRecord);

  const [targetRecord, setTargetRecord] = useState<RecordType>(record);
  const [targetLayer, setTargetLayer] = useState<LayerType>(layer);
  const [targetRecordSet, setTargetRecordSet] = useState<RecordType[] | undefined>(recordSet);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhotoType>(SelectedPhotoTemplate);
  const [latlon, setLatLon] = useState<LatLonDMSType>(LatLonDMSTemplate);
  const [recordNumber, setRecordNumber] = useState(1);
  const [isDecimal, setIsDecimal] = useState(true);
  const [temporaryDeletePhotoList, setTemporaryDeletePhotoList] = useState<{ photoId: string; uri: string }[]>([]);
  const [temporaryAddedPhotoList, setTemporaryAddedPhotoList] = useState<{ photoId: string; uri: string }[]>([]);
  // console.log('$$$ temporaryDeletePhotoList $$$', temporaryDeletePhotoList);
  // console.log('%%% temporaryAddedPhotoList %%%', temporaryAddedPhotoList);

  const { deleteLocalPhoto, createThumbnail, deleteRecordPhotos } = usePhoto();

  useEffect(() => {
    if (targetLayer.type === 'POINT') {
      const newLatLon = toLatLonDMS(targetRecord.coords as LocationType);
      setLatLon(newLatLon);
    }
  }, [targetLayer.type, targetRecord.coords]);

  useEffect(() => {
    dispatch(editSettingsAction({ selectedRecord: { layerId: layer.id, record: record } }));
    setTargetRecord(record);
    setTargetLayer(layer);
    setTargetRecordSet(recordSet);
    setRecordNumber(1);
  }, [dispatch, layer, record, recordSet]);

  const setIsEditingRecord = useCallback(
    (value: boolean) => {
      dispatch(editSettingsAction({ isEditingRecord: value }));
    },
    [dispatch]
  );

  const changeRecord = useCallback(
    (newRecord: RecordType) => {
      dispatch(editSettingsAction({ selectedRecord: { layerId: layer.id, record: newRecord } }));
      setTargetRecord(newRecord);
    },
    [dispatch, layer.id]
  );

  const saveToStorage = useCallback(
    async (fileUri: string, fileName: string, options?: { copy: boolean }) => {
      const folder =
        projectId !== undefined
          ? `${PHOTO_FOLDER}/${projectId}/${targetLayer.id}/${dataUser.uid}`
          : `${PHOTO_FOLDER}/LOCAL/${targetLayer.id}/OWNER`;
      await FileSystem.makeDirectoryAsync(folder, {
        intermediates: true,
      });
      const newUri = folder + '/' + fileName;
      await FileSystem.copyAsync({ from: fileUri, to: newUri });
      if (options && options.copy) {
        await MediaLibrary.createAssetAsync(newUri);
      }

      return newUri;
    },
    [dataUser.uid, projectId, targetLayer.id]
  );

  const pickImage = useCallback(
    async (name: string) => {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          //aspect: [4, 3],
          quality: 1,
        });

        if (!result.cancelled) {
          //console.log(result);
          let extension;
          let fileName;
          let uri;
          //ImagePickerのバグのためwebに処理を追加
          //https://github.com/expo/expo/issues/9984
          if (Platform.OS === 'web') {
            extension = result.uri.split(';')[0].split('/')[1];
            fileName = `EMAP_${dayjs().format('YYYYMMDD_HHmmss')}.${extension}`;
            const res = await fetch(result.uri);
            const blob = await res.blob();
            uri = URL.createObjectURL(blob);
            //写真のデータそのもの。変更可能？
          } else {
            extension = result.uri.split('.').pop();
            fileName = `EMAP_${dayjs().format('YYYYMMDD_HHmmss')}.${extension}`;
            uri = result.uri;
            uri = await saveToStorage(uri, fileName);
          }
          //console.log('###', result.uri);
          const thumbnail = await createThumbnail(uri);
          //console.log('$$$', uri);
          const m = cloneDeep(targetRecord);
          const photoId = uuidv4();
          (m.field[name] as PhotoType[]).push({
            id: photoId,
            name: fileName,
            uri: uri,
            url: null,
            width: result.width,
            height: result.height,
            thumbnail: thumbnail,
            key: null,
          } as PhotoType);

          //console.log(m.field[name]);
          setTargetRecord(m);
          setIsEditingRecord(true);
          setTemporaryAddedPhotoList([...temporaryAddedPhotoList, { photoId, uri }]);
        }

        //console.log(result);
      } catch (error) {
        console.log(error);
      }
    },
    [createThumbnail, saveToStorage, setIsEditingRecord, targetRecord, temporaryAddedPhotoList]
  );

  const takePhoto = useCallback(
    async (name: string) => {
      let res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (res.status !== 'granted') {
        //console.log('require camera permission');
        return;
      }
      res = await ImagePicker.requestCameraPermissionsAsync();
      if (res.status !== 'granted') {
        //console.log('require camera permission');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        exif: true,
      });
      if (!result.cancelled) {
        const extension = result.uri.split('.').pop();
        const fileName = `EMAP_${dayjs().format('YYYYMMDD_HHmmss')}.${extension}`;
        const uri = await saveToStorage(result.uri, fileName, {
          copy: true,
        });

        const thumbnail = await createThumbnail(uri);
        const m = cloneDeep(targetRecord);
        const photoId = uuidv4();
        (m.field[name] as PhotoType[]).push({
          id: photoId,
          name: fileName,
          uri: uri,
          url: null,
          width: result.width,
          height: result.height,
          thumbnail: thumbnail,
          key: null,
        });
        setTargetRecord(m);
        setIsEditingRecord(true);
        setTemporaryAddedPhotoList([...temporaryAddedPhotoList, { photoId, uri }]);
      }
    },
    [createThumbnail, saveToStorage, setIsEditingRecord, targetRecord, temporaryAddedPhotoList]
  );

  const removeSelectedPhoto = useCallback(async () => {
    if (selectedPhoto.uri) {
      const addedPhoto = temporaryAddedPhotoList.find(({ photoId }) => photoId === selectedPhoto.id);
      if (addedPhoto === undefined) {
        setTemporaryDeletePhotoList([
          ...temporaryDeletePhotoList,
          { photoId: selectedPhoto.id, uri: selectedPhoto.uri },
        ]);
      } else {
        //一旦追加したものを削除する場合
        const updatedList = temporaryAddedPhotoList.filter(({ photoId }) => photoId !== selectedPhoto.id);
        setTemporaryAddedPhotoList(updatedList);
      }
    }
    const m = cloneDeep(targetRecord);
    if (projectId === undefined) {
      (m.field[selectedPhoto!.fieldName] as PhotoType[]).splice(selectedPhoto!.index, 1);
    } else {
      //アップロードする際に削除すべきものはuriをundefinedにする
      (m.field[selectedPhoto!.fieldName] as PhotoType[])[selectedPhoto!.index] = { ...selectedPhoto, uri: undefined };
    }

    setSelectedPhoto({} as SelectedPhotoType);
    setTargetRecord(m);
    setIsEditingRecord(true);
  }, [projectId, selectedPhoto, setIsEditingRecord, targetRecord, temporaryAddedPhotoList, temporaryDeletePhotoList]);

  const setPhoto = useCallback(async (fieldName: string, photo: PhotoType, index: number) => {
    //console.log('!!! photo !!!', photo);
    let hasLocal = false;
    if (photo.uri) {
      if (Platform.OS === 'web') {
        //web版はpickerImageで読み込んだuriはbase64で読み込まれる。
        hasLocal = photo.uri !== null;
      } else {
        const { exists } = await FileSystem.getInfoAsync(photo.uri);
        //PHOTO_FOLDERになければオリジナルがあってもダウンロードするバージョン
        //hasLocal = exists && photo.url !== null;

        //PHOTO_FOLDERもしくはオリジナルがあればダウンロードしないバージョン
        hasLocal = exists;
      }
    }
    setSelectedPhoto({ ...photo, hasLocal, index: index, fieldName: fieldName });
  }, []);

  const saveData = useCallback(() => {
    if (tracking !== undefined && tracking.dataId === targetRecord.id) {
      return { isOK: false, message: t('hooks.message.cannotEditInTracking') };
    }

    if (!targetLayer.active && !drawTools.hisyouzuTool.active) {
      return { isOK: false, message: t('hooks.message.noEditMode') };
    }

    const { isOK, message } = checkFieldInput(targetLayer, targetRecord);
    if (!isOK) {
      return { isOK: false, message: message };
    }
    if (!checkCoordsInput(latlon, isDecimal)) {
      return { isOK: false, message: t('hooks.message.invalidCoordinate') };
    }

    temporaryDeletePhotoList.forEach(({ uri }) => deleteLocalPhoto(uri));
    setTemporaryDeletePhotoList([]);
    setTemporaryAddedPhotoList([]);
    const updatedRecord = updateRecordCoords(targetRecord, latlon, isDecimal);
    dispatch(
      updateRecordsAction({
        layerId: targetLayer.id,
        userId: targetRecord.userId,
        data: [updatedRecord],
      })
    );
    setTargetRecord(updatedRecord);
    if (targetRecordSet !== undefined) {
      const updatedRecordSet = targetRecordSet.map((d) => (d.id === updatedRecord.id ? updatedRecord : d));
      setTargetRecordSet(updatedRecordSet);
    }
    setIsEditingRecord(false);
    return { isOK: true, message: '' };
  }, [
    tracking,
    targetRecord,
    targetLayer,
    drawTools.hisyouzuTool.active,
    latlon,
    isDecimal,
    temporaryDeletePhotoList,
    dispatch,
    targetRecordSet,
    setIsEditingRecord,
    deleteLocalPhoto,
  ]);

  const deleteRecord = useCallback(() => {
    if (tracking !== undefined && tracking.dataId === targetRecord.id) {
      return { isOK: false, message: t('hooks.message.cannotDeleteInTracking') };
    }

    if (!targetLayer.active) {
      return { isOK: false, message: t('hooks.message.noEditMode') };
    }

    if (isEditingRecord) {
      saveData();
    }

    deleteRecordPhotos(targetLayer, targetRecord, projectId, targetRecord.userId);
    setTemporaryDeletePhotoList([]);
    setTemporaryAddedPhotoList([]);
    dispatch(
      deleteRecordsAction({
        layerId: targetLayer.id,
        userId: targetRecord.userId,
        data: [targetRecord],
      })
    );
    return { isOK: true, message: '' };
  }, [tracking, targetRecord, projectId, targetLayer, isEditingRecord, deleteRecordPhotos, dispatch, saveData]);

  const changeField = useCallback(
    (name: string, value: string) => {
      const m = cloneDeep(targetRecord);
      if (m.field[name] !== value) {
        m.field[name] = value;
        setTargetRecord(m);
        setIsEditingRecord(true);
      }
    },
    [setIsEditingRecord, targetRecord]
  );

  const submitField = useCallback(
    (name: string, format: string) => {
      //console.log(targetRecord.field[name]);
      const formatted = formattedInputs(targetRecord.field[name], format);
      const m = cloneDeep(targetRecord);
      m.field[name] = formatted.result;
      setTargetRecord(m);
    },
    [targetRecord]
  );

  const changeLatLonType = useCallback(() => {
    if (!checkCoordsInput(latlon, isDecimal)) {
      return { isOK: false, message: t('hooks.message.invalidCoordinate') };
    }
    const latLonDms = LatLonDMS(latlon, isDecimal);
    setLatLon(latLonDms);
    setIsDecimal(!isDecimal);
  }, [isDecimal, latlon]);

  const changeLatLon = useCallback(
    (val: string, latlonType: LatLonDMSKey, dmsType: DMSKey) => {
      const newLatLon = cloneDeep(latlon);
      newLatLon[latlonType][dmsType] = val;
      setLatLon(newLatLon);
      setIsEditingRecord(true);
    },
    [latlon, setIsEditingRecord]
  );

  const cancelUpdate = useCallback(() => {
    setIsEditingRecord(false);
    temporaryAddedPhotoList.forEach(({ uri }) => deleteLocalPhoto(uri));
    setTemporaryDeletePhotoList([]);
    setTemporaryAddedPhotoList([]);
  }, [deleteLocalPhoto, setIsEditingRecord, temporaryAddedPhotoList]);

  return {
    targetRecord,
    targetLayer,
    targetRecordSet,
    latlon,
    selectedPhoto,
    isEditingRecord,
    isDecimal,
    recordNumber,
    setRecordNumber,
    changeRecord,
    saveData,
    pickImage,
    takePhoto,
    removeSelectedPhoto,
    setPhoto,
    deleteRecord,
    changeLatLonType,
    changeField,
    submitField,
    changeLatLon,
    cancelUpdate,
  } as const;
};
