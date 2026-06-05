export type SaveEntityType = 'area' | 'location';

const ENTITY_LABEL: Record<SaveEntityType, string> = {
  area: 'kho',
  location: 'vị trí',
};

const CODE_LABEL: Record<SaveEntityType, string> = {
  area: 'Mã kho',
  location: 'Mã vị trí',
};

function extractErrorDetail(err: unknown): string {
  const body = (err as { error?: unknown })?.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    const record = body as { detail?: unknown; message?: unknown };
    if (typeof record.detail === 'string' && record.detail.trim()) {
      return record.detail;
    }
    if (Array.isArray(record.detail)) {
      return record.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg?: string }).msg || '');
          }
          return JSON.stringify(item);
        })
        .filter(Boolean)
        .join('; ');
    }
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
  }
  const message = (err as { message?: string })?.message;
  return typeof message === 'string' ? message : '';
}

function isEmptyCodeViolation(detail: string): boolean {
  const lower = detail.toLowerCase();
  return (
    lower.includes('key (code)=()') ||
    /parameters:\s*\(\s*''\s*,/.test(detail) ||
    /\[parameters:\s*\(\s*''\s*,/.test(detail)
  );
}

function isDuplicateCodeViolation(detail: string): boolean {
  const lower = detail.toLowerCase();
  if (!lower.includes('uniqueviolation') && !lower.includes('duplicate key')) {
    return false;
  }

  const codeConstraints = [
    'areas_code_key',
    'locations_code_key',
    '_code_key',
    'key (code)=',
  ];

  return codeConstraints.some((pattern) => lower.includes(pattern.toLowerCase()));
}

/** Chuyển response lỗi 400 từ BE thành thông báo tiếng Việt cho form lưu kho/vị trí. */
export function resolveEntitySaveErrorMessage(
  err: unknown,
  entity: SaveEntityType,
  isEditMode = false
): string {
  const detail = extractErrorDetail(err);
  const codeLabel = CODE_LABEL[entity];
  const entityLabel = ENTITY_LABEL[entity];
  const action = isEditMode ? 'Cập nhật' : 'Thêm mới';

  if (detail) {
    if (isEmptyCodeViolation(detail)) {
      return `${codeLabel} không được để trống.`;
    }

    if (isDuplicateCodeViolation(detail)) {
      return `${codeLabel} đã tồn tại trong hệ thống. Vui lòng nhập mã khác.`;
    }

    if (
      detail.toLowerCase().includes('uniqueviolation') ||
      detail.toLowerCase().includes('duplicate key')
    ) {
      return `${action} ${entityLabel} thất bại: dữ liệu bị trùng với bản ghi đã có.`;
    }
  }

  return `${action} ${entityLabel} thất bại. Vui lòng thử lại.`;
}

/** Thông báo lỗi API chung — không hiển thị raw "Http failure response...". */
export function resolveApiErrorMessage(
  err: unknown,
  context = 'Thao tác thất bại'
): string {
  const status = (err as { status?: number })?.status;
  let detail = extractErrorDetail(err);

  if (detail) {
    const lower = detail.toLowerCase();
    if (
      lower.includes('duplicate') ||
      lower.includes('uniqueviolation') ||
      lower.includes('unique constraint') ||
      lower.includes('inventories_identifier_key')
    ) {
      return 'Phê duyệt thất bại: phát hiện mã trùng trong kho (identifier đã tồn tại). Vui lòng kiểm tra pallet/thùng.';
    }
    if (detail.length > 300) {
      detail = `${detail.slice(0, 300)}...`;
    }
    return `${context}: ${detail}`;
  }

  const rawMessage = (err as { message?: string })?.message || '';
  if (/http failure response/i.test(rawMessage)) {
    if (status && status >= 500) {
      return `${context}: Lỗi hệ thống (${status}). Vui lòng thử lại sau hoặc liên hệ quản trị.`;
    }
    if (status) {
      return `${context}: Máy chủ trả lỗi (${status}).`;
    }
    return `${context}: Không thể kết nối máy chủ.`;
  }

  if (rawMessage.trim()) {
    return `${context}: ${rawMessage}`;
  }

  return `${context}. Vui lòng thử lại.`;
}
