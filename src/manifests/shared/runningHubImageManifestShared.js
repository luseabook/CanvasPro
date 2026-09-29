import {
  RUNNINGHUB_INSTANCE_OPTIONS,
  RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES,
} from '../../modules/runningHubInstanceTypes.js';

export { RUNNINGHUB_INSTANCE_TYPE_ALLOWED_VALUES };

export const RH_IMAGE_INSTANCE_FIELD = Object.freeze({
  id: 'rhInstanceType',
  type: 'segmented',
  placement: 'instance',
  label: '显存',
  defaultValue: 'default',
  options: RUNNINGHUB_INSTANCE_OPTIONS,
});
export const RH_IMAGE_BATCH_SIZE_FIELD = Object.freeze({
  id: 'batchSize',
  type: 'segmented',
  placement: 'batch',
  label: 'Batch',
  defaultValue: 1,
  options: Object.freeze([
    Object.freeze({ value: 1, label: '1x', selectedLabel: '1x' }),
    Object.freeze({ value: 2, label: '2x', selectedLabel: '2x' }),
    Object.freeze({ value: 4, label: '4x', selectedLabel: '4x' }),
  ]),
});
