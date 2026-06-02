/** Dòng hiển thị trong bảng scan (map từ response with-details / scan). */
export interface MappedScannedRow {
  scanType: 'pallet' | 'thung';
  refId?: number;
  maHangHoa: string;
  tenHangHoa: string;
  serialPallet: string;
  serialThung: string;
  soLuong: number;
  locationId?: string | number;
  thoiDiemScan: string;
}

function formatDateForDisplay(dateValue: string): string {
  if (!dateValue) return '---';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

/** Thùng đã lưu trong đơn (mảng inventories của with-details). */
export function mapSavedInventoryRow(item: any): MappedScannedRow {
  const nested = item?.inventory ?? item;
  return {
    scanType: 'thung',
    refId: Number(item.inventory_id ?? nested?.id ?? item.id),
    maHangHoa: item.sap_code ?? nested?.sap_code ?? '---',
    tenHangHoa: item.inventory_name ?? nested?.name ?? item.name ?? '---',
    serialPallet: item.inventory_serial_pallet ?? nested?.serial_pallet ?? item.serial_pallet ?? '---',
    serialThung:
      item.inventory_identifier ??
      item.identifier ??
      nested?.identifier ??
      '---',
    soLuong: Number(
      item.quantity ?? item.available_quantity ?? nested?.available_quantity ?? nested?.initial_quantity ?? 0
    ),
    locationId: item.inventory_location_id ?? nested?.location_id ?? item.location_id,
    thoiDiemScan: formatDateForDisplay(item.created_at ?? item.scan_time ?? ''),
  };
}

/** Pallet đã lưu trong đơn (mảng pallets của with-details). */
export function mapSavedPalletRow(item: any): MappedScannedRow {
  const nestedInvs: any[] = Array.isArray(item.inventories) ? item.inventories : [];
  const firstInv = nestedInvs[0];
  return {
    scanType: 'pallet',
    refId: Number(item.pallet_info_detail_id ?? item.import_pallet_id ?? item.pallet_id ?? item.id),
    maHangHoa: firstInv?.sap_code ?? item.sap_code ?? item.item_no_sku ?? '---',
    tenHangHoa: firstInv?.name ?? item.customer_name ?? item.name ?? '---',
    serialPallet: item.serial_pallet ?? item.pallet?.serial_pallet ?? '---',
    serialThung: firstInv?.identifier ?? '---',
    soLuong: Number(item.total_quantity ?? firstInv?.quantity ?? firstInv?.available_quantity ?? 0),
    locationId: item.location_id ?? firstInv?.location_id,
    thoiDiemScan: formatDateForDisplay(item.created_at ?? item.scan_time ?? ''),
  };
}

/** Parse body POST with-details / approvals/with-details. */
export function mapWithDetailsResponse(detail: any): {
  requirement: any;
  scannedRows: MappedScannedRow[];
} {
  const payload = detail?.data ?? detail;
  const requirement = payload?.requirement ?? payload;
  const inventories: any[] = payload?.inventories ?? payload?.inventory_items ?? [];
  const pallets: any[] = payload?.pallets ?? payload?.pallet_items ?? [];

  const scannedRows: MappedScannedRow[] = [
    ...inventories.map(mapSavedInventoryRow),
    ...pallets.map(mapSavedPalletRow),
  ];

  return { requirement, scannedRows };
}

/** GET /api/warehouse-import/pallets/{serial_pallet} */
export function mapImportPalletScanResponse(res: any): {
  palletDetailId: number;
  serialPallet: string;
  inventoryIdentifier: string;
  quantity: number;
  locationId?: number;
  sapCode: string;
  name: string;
} {
  const body = res?.data ?? res;
  const pallet = body?.pallet ?? {};
  const inventories: any[] = Array.isArray(body?.inventories) ? body.inventories : [];
  const firstInv = inventories[0] ?? {};

  const palletDetailId = Number(
    pallet.import_pallet_id ?? pallet.pallet_info_detail_id ?? pallet.id
  );
  if (!palletDetailId) {
    throw new Error('Pallet detail id not found');
  }

  const totalQty =
    Number(pallet.total_quantity) ||
    inventories.reduce((sum, inv) => sum + Number(inv?.quantity ?? inv?.available_quantity ?? 0), 0);

  return {
    palletDetailId,
    serialPallet: pallet.serial_pallet ?? '',
    inventoryIdentifier: firstInv?.identifier ?? '---',
    quantity: totalQty,
    locationId: pallet.location_id ?? firstInv?.location_id,
    sapCode: firstInv?.sap_code ?? pallet.item_no_sku ?? '',
    name: firstInv?.name ?? pallet.customer_name ?? '',
  };
}

export function toDisplayScannedItem(
  row: MappedScannedRow,
  getLocationCode: (id: string | number | undefined) => string,
  defaultKho: string
) {
  return {
    scanType: row.scanType,
    refId: row.refId,
    maHangHoa: row.maHangHoa,
    tenHangHoa: row.tenHangHoa,
    serialPallet: row.serialPallet,
    serialThung: row.serialThung,
    soLuong: row.soLuong,
    kho: getLocationCode(row.locationId) || defaultKho,
    thoiDiemScan: row.thoiDiemScan,
  };
}
