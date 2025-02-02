import { useCallback, useEffect, useMemo, useState } from 'react';
import { ColorStyle, FeatureType, FormatType, LayerType, PermissionType } from '../types';
import { PHOTO_FOLDER } from '../constants/AppConstants';

import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../modules';
import { formattedInputs } from '../utils/Format';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { addDataAction, deleteDataAction, updateDataAction } from '../modules/dataSet';
import { addLayerAction, deleteLayerAction, updateLayerAction } from '../modules/layers';
import { getInitialFieldValue } from '../utils/Data';
import { checkLayerInputs } from '../utils/Layer';
import { t } from '../i18n/config';
import sanitize from 'sanitize-filename';

export type UseLayerEditReturnType = {
  targetLayer: LayerType;
  isEdited: boolean;
  isNewLayer: boolean;
  editable: {
    state: boolean;
    message: string;
  };
  saveLayer: () => {
    isOK: boolean;
    message: string;
  };
  deleteLayer: () => void;
  changeLayerName: (val: string) => void;
  submitLayerName: () => void;
  changeFeatureType: (itemValue: FeatureType) => void;
  changePermission: (val: PermissionType) => void;
  changeFieldOrder: (index: number) => void;
  changeFieldName: (index: number, val: string) => void;
  submitFieldName: (index: number) => void;
  changeFieldFormat: (index: number, itemValue: FormatType) => void;
  deleteField: (id: number) => void;
  addField: () => void;
};

export const useLayerEdit = (
  layer: LayerType,
  isStyleEdited: boolean,
  fieldIndex: number | undefined,
  itemValues: { value: string; isOther: boolean }[] | undefined,
  colorStyle: ColorStyle | undefined
): UseLayerEditReturnType => {
  const dispatch = useDispatch();
  const projectId = useSelector((state: AppState) => state.settings.projectId);
  const layers = useSelector((state: AppState) => state.layers);
  const user = useSelector((state: AppState) => state.user);
  const dataUser = useMemo(
    () => (projectId === undefined ? { ...user, uid: undefined, displayName: null } : user),
    [projectId, user]
  );
  const tracking = useSelector((state: AppState) => state.settings.tracking);
  const dataSet = useSelector((state: AppState) => state.dataSet.filter((d) => d.layerId === layer.id));
  const isNewLayer = useSelector((state: AppState) => state.layers.every((d) => d.id !== layer.id));

  const [targetLayer, setTargetLayer] = useState<LayerType>(layer);
  const [isEdited, setIsEdited] = useState(isStyleEdited);

  const editable = useMemo(() => {
    if (tracking !== undefined && tracking.layerId === layer.id) {
      return { state: false, message: t('hooks.message.cannotChangeInTracking') };
    }

    return { state: true, message: '' };
  }, [layer.id, tracking]);

  useEffect(() => {
    setTargetLayer(layer);
    setIsEdited(isStyleEdited);
  }, [isStyleEdited, layer]);

  useEffect(() => {
    if (isStyleEdited && colorStyle !== undefined) {
      setIsEdited(true);
      setTargetLayer({ ...targetLayer, colorStyle: colorStyle });
    }
    //targetLayerはループするので入れてはいけない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStyleEdited, colorStyle]);

  useEffect(() => {
    if (isStyleEdited && itemValues !== undefined && fieldIndex !== undefined) {
      const newTargetLayer = cloneDeep(targetLayer);
      const targetFormat = newTargetLayer.field[fieldIndex].format;
      if (targetFormat === 'STRING') {
        newTargetLayer.field[fieldIndex].defaultValue = itemValues[0] ? itemValues[0].value : undefined;
      } else if (targetFormat === 'INTEGER') {
        newTargetLayer.field[fieldIndex].defaultValue = itemValues[0] ? parseInt(itemValues[0].value, 10) : undefined;
      } else if (targetFormat === 'DECIMAL') {
        newTargetLayer.field[fieldIndex].defaultValue = itemValues[0] ? parseFloat(itemValues[0].value) : undefined;
      } else {
        newTargetLayer.field[fieldIndex].list = itemValues;
      }
      setIsEdited(true);
      setTargetLayer(newTargetLayer);
    }
    //targetLayerはループするので入れてはいけない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStyleEdited, itemValues, fieldIndex]);

  const updateDataOfTheLayer = useCallback(
    (
      addedFields: { id: string; name: string; format: FormatType; list?: { value: string; isOther: boolean }[] }[],
      changeFields: { id: string; name: string; format: FormatType; list?: { value: string; isOther: boolean }[] }[],
      deletedFields: { id: string; name: string; format: string }[]
    ) => {
      const updateDataSet = cloneDeep(dataSet);
      updateDataSet.forEach((userData) => {
        //既存のデータに追加フィールドの値を初期化
        userData.data.forEach((d) =>
          addedFields.forEach(({ name, format, list }) => (d.field[name] = getInitialFieldValue(format, list)))
        );
        //更新されたフィールドの値を初期化
        userData.data.forEach((d) =>
          changeFields.forEach(({ name, format, list }) => (d.field[name] = getInitialFieldValue(format, list)))
        );
        //データのフィールドを削除
        userData.data.forEach((d) => {
          deletedFields.forEach(({ name }) => delete d.field[name]);
        });
      });
      dispatch(updateDataAction(updateDataSet));
    },
    [dataSet, dispatch]
  );

  const saveLayer = useCallback(() => {
    const { isOK, message } = checkLayerInputs(targetLayer);
    if (!isOK) {
      return { isOK: false, message };
    }

    const oldLayer = layers.find((l) => l.id === targetLayer.id);
    const initialFields = oldLayer !== undefined ? oldLayer.field : [];
    const updateFields = targetLayer.field;
    const deletedFields = initialFields.filter((n) => !updateFields.find((p) => p.id === n.id));
    const addedFields = updateFields.filter((n) => !initialFields.find((p) => p.id === n.id));
    const changedFields = updateFields.filter((n) =>
      initialFields.find(
        (p) => p.id === n.id && (p.format !== n.format || JSON.stringify(p.list) !== JSON.stringify(n.list))
      )
    );
    //ラベル対象のフィールドが削除されていたらラベルを変更
    if (deletedFields.some(({ name }) => name === targetLayer.label)) {
      targetLayer.label = '';
    }

    //追加されたフィールドのデータを初期化し、削除されたフィールドをデータからも削除
    updateDataOfTheLayer(addedFields, changedFields, deletedFields);

    if (isNewLayer) {
      dispatch(addLayerAction(targetLayer));
      dispatch(addDataAction([{ layerId: targetLayer.id, userId: dataUser.uid, data: [] }]));
    } else {
      dispatch(updateLayerAction(targetLayer));
    }
    setIsEdited(false);
    return { isOK: true, message: '' };
  }, [dataUser.uid, dispatch, isNewLayer, layers, targetLayer, updateDataOfTheLayer]);

  const deleteLayerPhotos = useCallback(() => {
    if (Platform.OS === 'web') {
      return;
    } else {
      if (projectId === undefined) return;
      const folder = `${PHOTO_FOLDER}/${projectId}/${targetLayer.id}`;
      FileSystem.deleteAsync(folder, { idempotent: true });
    }
  }, [projectId, targetLayer.id]);

  const deleteLayer = useCallback(async () => {
    //データ内の写真の削除
    deleteLayerPhotos();
    //データの削除
    dispatch(deleteDataAction(dataSet));
    //レイヤの削除
    dispatch(deleteLayerAction(targetLayer));
  }, [dataSet, deleteLayerPhotos, dispatch, targetLayer]);

  const changeLayerName = useCallback(
    (val: string) => {
      const m = cloneDeep(targetLayer);
      m.name = val;
      setTargetLayer(m);
      setIsEdited(true);
    },
    [targetLayer]
  );

  const submitLayerName = useCallback(() => {
    const m = cloneDeep(targetLayer);
    m.name = sanitize(targetLayer.name);
    setTargetLayer(m);
  }, [targetLayer]);

  const changeFeatureType = useCallback(
    (itemValue: FeatureType) => {
      const m = cloneDeep(targetLayer);
      if (m.type !== itemValue) {
        m.type = itemValue;
        setTargetLayer(m);
        setIsEdited(true);
      }
    },
    [targetLayer]
  );

  const changePermission = useCallback(
    (val: PermissionType) => {
      const m = cloneDeep(targetLayer);
      m.permission = val;
      setTargetLayer(m);
      setIsEdited(true);
    },
    [targetLayer]
  );

  const changeFieldOrder = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newTargetLayer = cloneDeep(targetLayer);
      [newTargetLayer.field[index], newTargetLayer.field[index - 1]] = [
        newTargetLayer.field[index - 1],
        newTargetLayer.field[index],
      ];
      setTargetLayer(newTargetLayer);
      setIsEdited(true);
    },
    [targetLayer]
  );

  const changeFieldName = useCallback(
    (index: number, val: string) => {
      const m = cloneDeep(targetLayer);
      m.field[index].name = val;
      setTargetLayer(m);
      setIsEdited(true);
    },
    [targetLayer]
  );

  const submitFieldName = useCallback(
    (index: number) => {
      const { result } = formattedInputs(targetLayer.field[index].name, 'STRING');
      const m = cloneDeep(targetLayer);
      m.field[index].name = result.toString();
      setTargetLayer(m);
    },
    [targetLayer]
  );

  const changeFieldFormat = useCallback(
    (index: number, itemValue: FormatType) => {
      const m = cloneDeep(targetLayer);
      if (m.field[index].format !== itemValue) {
        m.field[index].format = itemValue;
        setTargetLayer(m);
        setIsEdited(true);
      }
    },
    [targetLayer]
  );

  const deleteField = useCallback(
    (id: number) => {
      const m = cloneDeep(targetLayer);
      m.field.splice(id, 1);

      setTargetLayer(m);
      setIsEdited(true);
    },
    [targetLayer]
  );

  const addField = useCallback(() => {
    const m = cloneDeep(targetLayer);
    m.field.push({ id: uuidv4(), name: '', format: 'STRING' });
    setTargetLayer(m);
    setIsEdited(true);
  }, [targetLayer]);

  return {
    targetLayer,
    isEdited,
    isNewLayer,
    editable,
    saveLayer,
    deleteLayer,
    changeLayerName,
    submitLayerName,
    changeFeatureType,
    changePermission,
    changeFieldOrder,
    changeFieldName,
    submitFieldName,
    changeFieldFormat,
    deleteField,
    addField,
  } as const;
};
