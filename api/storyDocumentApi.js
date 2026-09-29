import { post } from './requester.js';

export const STORY_DOCUMENT_FILE_LIMIT = 8 * 1024 * 1024;
export function isStoryDocumentFile(file) { return /\.(docx|pdf)$/i.test(file?.name || ''); }
export async function extractStoryDocument(file, { signal } = {}) {
  if (!isStoryDocumentFile(file)) throw new Error('仅支持 DOCX 和 PDF；旧版 DOC 请先另存为 DOCX。');
  if (!file.size || file.size > STORY_DOCUMENT_FILE_LIMIT) throw new Error('DOCX/PDF 必须非空且不超过 8MB。');
  if (signal?.aborted) throw new Error('文档导入已取消。');
  const mime = /\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const result = await post('/api/v2/story-workspace/document/extract', file, {
    provider: 'local', headers: { 'Content-Type': mime }, responseType: 'json', retries: 0, timeout: 60000, signal,
  });
  if (!result || typeof result.text !== 'string' || !result.text.trim()) throw new Error('后端没有返回可用文字；扫描文档需先进行 OCR。');
  return result;
}

export const STORY_DOCUMENT_EXTRACT_PATH="/api/v2/story-workspace/document/extract";

export const STORY_DOCUMENT_MAX_FILE_BYTES=0x14*0x400*0x400;

export const STORY_DOCUMENT_SUPPORTED_EXTENSIONS=Object["freeze"](["txt","docx","pdf"]);

function getFileExtension(_0x205c06){const _0x2207b9=String(_0x205c06||'')["trim"](),_0x5212c1=_0x2207b9["lastIndexOf"]('.');return _0x5212c1>=0x0?_0x2207b9["slice"](_0x5212c1+0x1)["toLowerCase"]():'';}

export function validateStoryDocumentFile(_0x4031c0){if(!_0x4031c0)return{'ok':![],'error':'请选择剧本文件。'};const _0x1b0e67=getFileExtension(_0x4031c0["name"]);if(_0x1b0e67==="doc")return{'ok':![],'error':'暂不支持旧版\x20DOC\x20文件，请先另存为\x20DOCX、PDF\x20或\x20TXT。'};if(!STORY_DOCUMENT_SUPPORTED_EXTENSIONS["includes"](_0x1b0e67))return{'ok':![],'error':"仅支持 TXT、DOCX 和文本型 PDF 文件。"};const _0x80ec47=Number(_0x4031c0["size"]||0x0);if(_0x80ec47<=0x0)return{'ok':![],'error':'剧本文件为空。'};if(_0x80ec47>STORY_DOCUMENT_MAX_FILE_BYTES)return{'ok':![],'error':"剧本文件不能超过 20 MB。"};return{'ok':!![],'extension':_0x1b0e67};}

export async function extractStoryDocumentText(_0x415eac,_0x5ecadc={}){const _0x667e43=validateStoryDocumentFile(_0x415eac);if(!_0x667e43['ok'])throw new Error(_0x667e43["error"]);const _0x4e92c0=new FormData();_0x4e92c0["append"]("file",_0x415eac,String(_0x415eac['name']||"script."+_0x667e43["extension"]));const _0x48a4e6=await post(STORY_DOCUMENT_EXTRACT_PATH,_0x4e92c0,{'provider':'local','signal':_0x5ecadc["signal"],'timeout':Number(_0x5ecadc["timeout"])||0x15f90}),_0x1261ae=typeof _0x48a4e6?.["text"]==="string"?_0x48a4e6["text"]:'';if(!_0x1261ae["trim"]())throw new Error("文档解析结果没有可用文本。");return{..._0x48a4e6,'text':_0x1261ae,'characterCount':Number["isFinite"](_0x48a4e6?.["characterCount"])?_0x48a4e6["characterCount"]:_0x1261ae["length"],'extension':String(_0x48a4e6?.["extension"]||_0x667e43['extension']),'warnings':Array['isArray'](_0x48a4e6?.["warnings"])?_0x48a4e6["warnings"]:[]};}
