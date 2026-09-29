import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE,
  buildPersonReplacementSourceCharacters,
  getPersonReplacementBoxedPeople,
  getPersonReplacementDuplicateRoleLabels,
  getPersonReplacementIdentityCorrectionDraftKey,
  getPersonReplacementLabelOptions,
  getPersonReplacementReusableLabels,
  normalizePersonReplacementBoundingBox,
  normalizePersonReplacementIdentityCorrectionDrafts,
  orderAndRelabelPersonReplacementPeople,
  resolvePersonReplacementDetectionLabel,
  resolvePersonReplacementLabelSourceCharacterId,
} from './personReplacementSourceIdentity.js';

test('sourceIdentity: 草稿键只在 shot/person 都非空时生成', () => {
  assert.equal(getPersonReplacementIdentityCorrectionDraftKey('s1', 'p1'), 's1:p1');
  assert.equal(getPersonReplacementIdentityCorrectionDraftKey('  s1  ', '  p1  '), 's1:p1');
  assert.equal(getPersonReplacementIdentityCorrectionDraftKey(1, 2), '1:2');
  assert.equal(getPersonReplacementIdentityCorrectionDraftKey('', 'p1'), '');
  assert.equal(getPersonReplacementIdentityCorrectionDraftKey('s1', '   '), '');
  assert.equal(getPersonReplacementIdentityCorrectionDraftKey(null, undefined), '');
});

test('sourceIdentity: 校正草稿只保留当前 shot/person，并校验来源角色与朝向', () => {
  const shots = [
    {
      id: 's1',
      people: [{ id: 'p1', sourceCharacterId: 'c1' }, { id: 'p2' }, { id: 'p3' }],
    },
  ];
  const sourceCharacters = [{ id: 'c2' }];
  const drafts = {
    's1:p1': { label: '  主角  ', sourceCharacterId: ' c1 ', orientation: 'front', extra: 1 },
    's1:p2': { label: '', sourceCharacterId: 'c2', orientation: 'unknown' },
    's1:p3': { label: '   ', sourceCharacterId: 'c9', orientation: 'diagonal' },
    's1:p1:stale': { label: '名单外', sourceCharacterId: 'c1', orientation: 'side' },
    's2:p1': { label: '别的镜头', sourceCharacterId: 'c1', orientation: 'side' },
  };
  assert.deepEqual(normalizePersonReplacementIdentityCorrectionDrafts(drafts, shots, sourceCharacters), {
    's1:p1': { label: '主角', sourceCharacterId: 'c1', orientation: 'front' },
    's1:p2': { sourceCharacterId: 'c2' },
  });
  assert.deepEqual(
    normalizePersonReplacementIdentityCorrectionDrafts({ 's1:p1': 'bad' }, shots, sourceCharacters),
    {},
  );
  assert.deepEqual(normalizePersonReplacementIdentityCorrectionDrafts([1, 2], shots, sourceCharacters), {});
  assert.deepEqual(normalizePersonReplacementIdentityCorrectionDrafts(null, null, null), {});
});

test('sourceIdentity: 可复用标签去重并排除已移除的自定义标签', () => {
  const project = {
    workspace: { removedCustomPersonLabels: ['主角', '  已删  ', ''] },
    shots: [
      { people: [{ label: '主角' }, { label: '主角' }, { label: '配角' }, { label: '   ' }, {}] },
      { people: [{ label: '路人' }, { label: '配角' }] },
    ],
  };
  assert.deepEqual(getPersonReplacementReusableLabels(project), ['配角', '路人']);
  assert.deepEqual(getPersonReplacementReusableLabels(), []);
  assert.deepEqual(getPersonReplacementReusableLabels({ shots: 'bad' }), []);
});

test('sourceIdentity: label 来源角色先查镜头人物，再按源角色名回退', () => {
  const project = {
    shots: [
      {
        people: [
          { label: '主角', sourceCharacterId: ' c9 ' },
          { label: '配角', sourceCharacterId: '   ' },
          { label: '路人', sourceCharacterId: 'c5' },
        ],
      },
    ],
    sourceCharacters: [
      { id: 'c2', name: '配角' },
      { id: 'c3', name: '主角' },
      { id: 'c6', name: '路人' },
    ],
  };
  assert.equal(resolvePersonReplacementLabelSourceCharacterId(project, ' 主角 '), 'c9');
  assert.equal(resolvePersonReplacementLabelSourceCharacterId(project, '配角'), 'c2');
  assert.equal(resolvePersonReplacementLabelSourceCharacterId(project, '路人'), 'c5');
  assert.equal(resolvePersonReplacementLabelSourceCharacterId(project, '不存在'), '');
  assert.equal(resolvePersonReplacementLabelSourceCharacterId(project, ''), '');
  assert.equal(resolvePersonReplacementLabelSourceCharacterId(), '');
});

test('sourceIdentity: 标签选项过滤移除项与重复项，补 selectedLabel，并追加自定义项', () => {
  const project = {
    shots: [{ people: [{ label: '主角', sourceCharacterId: 'c1' }] }],
    sourceCharacters: [],
  };
  const options = getPersonReplacementLabelOptions({
    labels: ['人物A', '主角', '主角', '', '配角'],
    selectedLabel: '  新角色  ',
    removedLabels: ['配角', '被删'],
    project,
  });
  assert.deepEqual(options, [
    { value: '人物A', label: '人物A', sourceCharacterId: '', deletable: false },
    { value: '主角', label: '主角', sourceCharacterId: 'c1', deletable: true },
    { value: '新角色', label: '新角色', sourceCharacterId: '', deletable: true },
    { value: PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE, label: '自定义' },
  ]);
  assert.equal(PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE, '__person_replacement_custom_label__');

  const deduped = getPersonReplacementLabelOptions({ labels: ['主角'], selectedLabel: '主角', project });
  assert.deepEqual(
    deduped.map((item) => item.value),
    ['主角', PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE],
  );

  const removedSelected = getPersonReplacementLabelOptions({
    labels: ['主角'],
    selectedLabel: '配角',
    removedLabels: ['配角'],
    project,
  });
  assert.deepEqual(
    removedSelected.map((item) => item.value),
    ['主角', PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE],
  );
});

test('sourceIdentity: 有框人物按中心位置过滤并排序', () => {
  const shot = {
    people: [
      { id: 'a', bbox: { x: 0.1, y: 0.5, width: 0.1, height: 0.1 } },
      { id: 'b', bbox: { x: 0.05, y: 0, width: 0.1, height: 0.1 } },
      { id: 'c', locator: { bbox: { x: 0.1, y: 0.5, width: 0.1, height: 0.1 } } },
      { id: 'd' },
    ],
  };
  assert.deepEqual(
    getPersonReplacementBoxedPeople(shot).map((person) => person.id),
    ['b', 'a', 'c'],
  );
  assert.deepEqual(
    shot.people.map((person) => person.id),
    ['a', 'b', 'c', 'd'],
  );
  assert.deepEqual(getPersonReplacementBoxedPeople(), []);
  assert.deepEqual(getPersonReplacementBoxedPeople({ people: 'bad' }), []);
});

test('sourceIdentity: 检测标签草稿优先，其次原标签，最后回退生成标号', () => {
  const project = {
    workspace: {
      identityCorrectionDrafts: {
        's1:p1': { label: '  草稿名  ' },
        's1:p2': { label: '   ' },
      },
    },
  };
  assert.equal(
    resolvePersonReplacementDetectionLabel({ id: 'p1', label: '原标签' }, 0, project, 's1'),
    '草稿名',
  );
  assert.equal(
    resolvePersonReplacementDetectionLabel({ id: 'p2', label: '原标签' }, 1, project, 's1'),
    '原标签',
  );
  assert.equal(resolvePersonReplacementDetectionLabel({ id: 'p3', label: '   ' }, 2, project, 's1'), '人物C');
  assert.equal(resolvePersonReplacementDetectionLabel({ id: 'p4' }, 0, project, 's1'), '人物A');
  assert.equal(resolvePersonReplacementDetectionLabel({}, 1, {}, ''), '人物B');
});

test('sourceIdentity: 重复角色标签只统计有框人物，并采用草稿标注', () => {
  const shot = {
    id: 's1',
    people: [
      { id: 'p1', label: '主角', bbox: { x: 0, y: 0, width: 0.1, height: 0.1 } },
      { id: 'p2', label: '配角', bbox: { x: 0.2, y: 0, width: 0.1, height: 0.1 } },
      { id: 'p3', label: '路人', bbox: { x: 0.4, y: 0, width: 0.1, height: 0.1 } },
      { id: 'p4', label: '路人' },
    ],
  };
  assert.deepEqual(getPersonReplacementDuplicateRoleLabels(shot, {}), []);
  const project = {
    workspace: { identityCorrectionDrafts: { 's1:p2': { label: '主角' } } },
  };
  assert.deepEqual(getPersonReplacementDuplicateRoleLabels(shot, project), ['主角']);

  const noIdShot = {
    people: [
      { id: 'p1', label: '甲', bbox: { x: 0, y: 0, width: 0.1, height: 0.1 } },
      { id: 'p2', label: '乙', bbox: { x: 0.2, y: 0, width: 0.1, height: 0.1 } },
    ],
  };
  const selectedProject = {
    workspace: {
      selectedShotId: 'sx',
      identityCorrectionDrafts: { 'sx:p2': { label: '甲' } },
    },
  };
  assert.deepEqual(getPersonReplacementDuplicateRoleLabels(noIdShot, selectedProject), ['甲']);
  assert.deepEqual(getPersonReplacementDuplicateRoleLabels(), []);
});

test('sourceIdentity: 聚合源角色图片、最低置信度、评审状态、成员数与歧义身份', () => {
  const shots = [
    {
      id: 's1',
      keyframeRef: 'kf1',
      people: [
        {
          id: 'p1',
          sourceCharacterId: 'c1',
          label: '甲',
          identityConfidence: 0.9,
          ambiguousIdentityIds: ['x', ''],
        },
        {
          id: 'p2',
          sourceCharacterId: 'c1',
          label: '甲',
          identityConfidence: 0.5,
          identityReviewRequired: true,
          ambiguousIdentityIds: ['y'],
        },
        { id: 'p3', sourceCharacterId: 'c2', label: '乙', identityConfidence: 0.7, identityMethod: 'osnet' },
        { id: 'p4', label: '无来源' },
      ],
    },
    {
      id: 's2',
      keyframeRef: 'kf2',
      people: [
        {
          id: 'p5',
          sourceCharacterId: 'c1',
          label: '甲',
          identityConfidence: 0.3,
          identityReviewStatus: 'confirmed',
        },
        { id: 'p6', sourceCharacterId: 'c2', label: '乙', identityConfidence: 0.8, identityMethod: 'manual' },
        { id: 'p7', sourceCharacterId: 'c3' },
      ],
    },
  ];
  const existing = [
    {
      id: 'c1',
      name: '源甲',
      exemplarShotId: 's0',
      exemplarPersonId: 'p0',
      ambiguousIdentityIds: ['z'],
      notes: '已有备注',
      identityReviewStatus: 'confirmed',
    },
  ];
  assert.deepEqual(buildPersonReplacementSourceCharacters(shots, existing), [
    {
      id: 'c1',
      name: '源甲',
      imageRefs: ['kf1', 'kf2'],
      confidence: 0.3,
      reviewRequired: true,
      identityReviewStatus: 'needs_review',
      memberCount: 3,
      exemplarShotId: 's0',
      exemplarPersonId: 'p0',
      ambiguousIdentityIds: ['z', 'x', 'y'],
      notes: '已有备注',
    },
    {
      id: 'c2',
      name: '乙',
      imageRefs: ['kf1', 'kf2'],
      confidence: 0.7,
      reviewRequired: false,
      identityReviewStatus: 'auto',
      memberCount: 2,
      exemplarShotId: 's1',
      exemplarPersonId: 'p3',
      ambiguousIdentityIds: [],
      notes: 'OSNet 跨镜头人物身份聚类',
    },
    {
      id: 'c3',
      name: '原人物3',
      imageRefs: ['kf2'],
      confidence: 0,
      reviewRequired: false,
      identityReviewStatus: 'auto',
      memberCount: 1,
      exemplarShotId: 's2',
      exemplarPersonId: 'p7',
      ambiguousIdentityIds: [],
      notes: '自动检测人物身份',
    },
  ]);
  assert.deepEqual(buildPersonReplacementSourceCharacters(), []);
});

test('sourceIdentity: needs_review 与 confirmed 直接来自人物或既有角色评审状态', () => {
  const needsReview = buildPersonReplacementSourceCharacters([
    { id: 's', people: [{ id: 'p', sourceCharacterId: 'c', identityReviewStatus: 'needs_review' }] },
  ])[0];
  assert.equal(needsReview.reviewRequired, true);
  assert.equal(needsReview.identityReviewStatus, 'needs_review');

  const confirmedPerson = buildPersonReplacementSourceCharacters([
    { id: 's', people: [{ id: 'p', sourceCharacterId: 'c', identityReviewStatus: 'confirmed' }] },
  ])[0];
  assert.equal(confirmedPerson.reviewRequired, false);
  assert.equal(confirmedPerson.identityReviewStatus, 'confirmed');

  const confirmedExisting = buildPersonReplacementSourceCharacters(
    [{ id: 's', people: [{ id: 'p', sourceCharacterId: 'c', identityConfidence: 0.4 }] }],
    [{ id: 'c', identityReviewStatus: 'confirmed' }],
  )[0];
  assert.equal(confirmedExisting.reviewRequired, false);
  assert.equal(confirmedExisting.identityReviewStatus, 'confirmed');
  assert.equal(confirmedExisting.name, '原人物1');
  assert.deepEqual(confirmedExisting.imageRefs, []);
  assert.equal(confirmedExisting.notes, '自动检测人物身份');
});

test('sourceIdentity: 边界框归一化到 0..1 且宽高受剩余空间限制', () => {
  assert.deepEqual(normalizePersonReplacementBoundingBox({ x: 0.2, y: 0.3, width: 0.5, height: 0.5 }), {
    x: 0.2,
    y: 0.3,
    width: 0.5,
    height: 0.5,
  });
  assert.deepEqual(normalizePersonReplacementBoundingBox({ x: -1, y: 2, width: 5, height: 5 }), {
    x: 0,
    y: 1,
    width: 1,
    height: 0,
  });
  const clamped = normalizePersonReplacementBoundingBox({ x: 0.8, y: 0.9, width: 0.5, height: 0.5 });
  assert.equal(clamped.x, 0.8);
  assert.equal(clamped.y, 0.9);
  assert.ok(Math.abs(clamped.width - 0.2) < 1e-9);
  assert.ok(Math.abs(clamped.height - 0.1) < 1e-9);
  assert.deepEqual(
    normalizePersonReplacementBoundingBox({ x: '0.5', y: '0.25', width: '0.25', height: '0.5' }),
    {
      x: 0.5,
      y: 0.25,
      width: 0.25,
      height: 0.5,
    },
  );
  assert.deepEqual(normalizePersonReplacementBoundingBox({ x: NaN, y: 'bad', width: -3, height: -0.5 }), {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  assert.deepEqual(normalizePersonReplacementBoundingBox(), { x: 0, y: 0, width: 0, height: 0 });
});

test('sourceIdentity: 排序重标保留人工标签，其余按位置生成并排序', () => {
  const people = [
    { id: 'b', identityMethod: 'manual', label: '  主角  ', bbox: { x: 1, y: 0, width: 0, height: 0 } },
    { id: 'a', bbox: { x: 0.1, y: 0, width: 0, height: 0 } },
    { id: 'c', label: '人物A', bbox: { x: 0.5, y: 0, width: 0, height: 0 } },
    { id: 'd', promptMarkerIndex: 5, bbox: { x: 0.7, y: 0, width: 0, height: 0 } },
  ];
  const out = orderAndRelabelPersonReplacementPeople(people);
  assert.deepEqual(
    out.map((person) => [person.id, person.label, person.promptMarkerIndex]),
    [
      ['c', '人物A', 0],
      ['d', '人物F', 5],
      ['a', '人物G', 6],
      ['b', '主角', 7],
    ],
  );
  assert.deepEqual(
    people.map((person) => person.id),
    ['b', 'a', 'c', 'd'],
  );
  assert.deepEqual(orderAndRelabelPersonReplacementPeople(), []);
});

test('sourceIdentity: 人工身份但空标签仍生成标号', () => {
  const out = orderAndRelabelPersonReplacementPeople([
    { id: 'm', identityMethod: 'manual', label: '   ', bbox: { x: 0.5, y: 0, width: 0, height: 0 } },
  ]);
  assert.deepEqual(
    out.map((person) => [person.id, person.label, person.promptMarkerIndex]),
    [['m', '人物A', 0]],
  );
});
