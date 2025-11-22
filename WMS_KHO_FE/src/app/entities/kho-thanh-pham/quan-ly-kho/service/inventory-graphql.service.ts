// inventory.service.ts
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaces
export interface InventoryDashboardItem {
    id: string;
    name: string | null;
    client_id: number | null;
    serial_pallet: string | null;
    identifier: string | null;
    po: string | null;
    available_quantity: number | null;
    initial_quantity: number | null;
    location_id: number | null;
    area_code: string | null;
    area_name: string | null;
    status: string | null;
    updated_by: string | null;
    received_date: string | null;
    updated_date: string | null;
}

export interface InventoryGroupedItem {
    group_key: string;
    group_value: string;
    total_available_quantity: number;
    total_initial_quantity: number;
    item_count: number;
    total_unique_products: number;
    total_clients: number;
    total_pos: number;
    total_pallets: number;
    total_containers: number;
    total_locations: number;
    last_updated: string | null;
    last_received: string | null;
}

export interface PaginationMeta {
    page: number;
    size: number;
    total_items: number;
    total_pages: number;
}

export interface InventoryDashboardResponse {
    data: InventoryDashboardItem[];
    meta: PaginationMeta;
}

export interface InventoryGroupedResponse {
    data: InventoryGroupedItem[];
    meta: PaginationMeta;
}

// GraphQL Queries
const INVENTORY_DASHBOARD_QUERY = gql`
  query InventoryDashboard(
    $page: Int
    $size: Int
    $name: String
    $client_id: Int
    $serial_pallet: String
    $identifier: String
    $po: String
    $location_id: Int
    $area_id: Int
    $status: String
    $updated_by: String
  ) {
    inventoryDashboard(
      page: $page
      size: $size
      name: $name
      client_id: $client_id
      serial_pallet: $serial_pallet
      identifier: $identifier
      po: $po
      location_id: $location_id
      area_id: $area_id
      status: $status
      updated_by: $updated_by
    ) {
      data {
        id
        name
        client_id
        serial_pallet
        identifier
        po
        available_quantity
        initial_quantity
        location_id
        area_code
        area_name
        status
        updated_by
        received_date
        updated_date
      }
      meta {
        page
        size
        total_items
        total_pages
      }
    }
  }
`;

const INVENTORY_DASHBOARD_GROUPED_QUERY = gql`
  query InventoryDashboardGrouped(
    $group_by: String!
    $page: Int
    $size: Int
    $name: String
    $client_id: Int
    $serial_pallet: String
    $identifier: String
    $po: String
    $location_id: Int
    $area_id: Int
    $status: String
    $updated_by: String
  ) {
    inventoryDashboardGrouped(
      group_by: $group_by
      page: $page
      size: $size
      name: $name
      client_id: $client_id
      serial_pallet: $serial_pallet
      identifier: $identifier
      po: $po
      location_id: $location_id
      area_id: $area_id
      status: $status
      updated_by: $updated_by
    ) {
      data {
        group_key
        group_value
        total_available_quantity
        total_initial_quantity
        item_count
        total_unique_products
        total_clients
        total_pos
        total_pallets
        total_containers
        total_locations
        last_updated
        last_received
      }
      meta {
        page
        size
        total_items
        total_pages
      }
    }
  }
`;

@Injectable({
    providedIn: 'root'
})
export class InventoryGraphqlService {
    constructor(private apollo: Apollo) { }

    /**
     * Lấy dữ liệu inventory dashboard mặc định (chi tiết)
     */
    getInventoryDashboard(params: {
        page?: number;
        size?: number;
        name?: string;
        client_id?: number;
        serial_pallet?: string;
        identifier?: string;
        po?: string;
        location_id?: number;
        area_id?: number;
        status?: string;
        updated_by?: string;
    }): Observable<InventoryDashboardResponse> {
        return this.apollo
            .query<{ inventoryDashboard: InventoryDashboardResponse }>({
                query: INVENTORY_DASHBOARD_QUERY,
                variables: {
                    page: params.page || 1,
                    size: params.size || 20,
                    ...params
                },
                fetchPolicy: 'network-only'
            })
            .pipe(map(result => result.data.inventoryDashboard));
    }

    /**
     * Lấy dữ liệu inventory dashboard nhóm theo (area, po, client, product)
     */
    getInventoryDashboardGrouped(params: {
        group_by: 'area' | 'po' | 'client' | 'product';
        page?: number;
        size?: number;
        name?: string;
        client_id?: number;
        serial_pallet?: string;
        identifier?: string;
        po?: string;
        location_id?: number;
        area_id?: number;
        status?: string;
        updated_by?: string;
    }): Observable<InventoryGroupedResponse> {
        // Destructure to avoid duplicating group_by in the spread
        const { group_by, page = 1, size = 20, ...filters } = params;

        return this.apollo
            .query<{ inventoryDashboardGrouped: InventoryGroupedResponse }>({
                query: INVENTORY_DASHBOARD_GROUPED_QUERY,
                variables: {
                    group_by,
                    page,
                    size,
                    ...filters
                },
                fetchPolicy: 'network-only'
            })
            .pipe(map(result => result.data.inventoryDashboardGrouped));
    }

    /**
     * Map dữ liệu từ API sang format hiển thị trên bảng
     */
    mapToTableData(
        item: InventoryDashboardItem | InventoryGroupedItem,
        viewMode: 'default' | 'po' | 'product' | 'area' | 'customer'
    ): any {
        if (viewMode === 'default') {
            const defaultItem = item as InventoryDashboardItem;
            return {
                id: defaultItem.id,
                maSanPham: defaultItem.identifier,
                tenSP: defaultItem.name,
                maKH: defaultItem.client_id,
                tenKH: '', // Cần join thêm từ bảng client nếu có
                maPallet: defaultItem.serial_pallet,
                maThung: '', // Cần lấy từ container nếu có
                po: defaultItem.po,
                soLuongTon: defaultItem.available_quantity,
                soLuongGoc: defaultItem.initial_quantity,
                khuVuc: defaultItem.area_code,
                area: defaultItem.area_name,
                location: defaultItem.location_id,
                status: defaultItem.status,
                updatedBy: defaultItem.updated_by,
                createdDate: defaultItem.received_date,
                updatedDate: defaultItem.updated_date
            };
        }

        const groupedItem = item as InventoryGroupedItem;

        switch (viewMode) {
            case 'po':
                return {
                    po: groupedItem.group_value,
                    soLuongSP: groupedItem.total_unique_products,
                    tongSLTon: groupedItem.total_available_quantity,
                    tongSLGoc: groupedItem.total_initial_quantity,
                    soPallet: groupedItem.total_pallets,
                    soThung: groupedItem.total_containers,
                    soKH: groupedItem.total_clients,
                    ngayNhapSomNhat: groupedItem.last_received,
                    ngayCapNhat: groupedItem.last_updated
                };

            case 'product':
                return {
                    maSanPham: groupedItem.group_key,
                    tenSP: groupedItem.group_value,
                    tongSLTon: groupedItem.total_available_quantity,
                    tongSLGoc: groupedItem.total_initial_quantity,
                    soPO: groupedItem.total_pos,
                    soKH: groupedItem.total_clients,
                    soKhuVuc: groupedItem.total_locations,
                    soPallet: groupedItem.total_pallets,
                    soThung: groupedItem.total_containers,
                    ngayNhapSomNhat: groupedItem.last_received
                };

            case 'area':
                return {
                    khuVuc: groupedItem.group_value,
                    tongSLTon: groupedItem.total_available_quantity,
                    tongSLGoc: groupedItem.total_initial_quantity,
                    soSP: groupedItem.total_unique_products,
                    soKH: groupedItem.total_clients,
                    soPO: groupedItem.total_pos,
                    soPallet: groupedItem.total_pallets,
                    soThung: groupedItem.total_containers,
                    soLocation: groupedItem.total_locations,
                    ngayCapNhat: groupedItem.last_updated
                };

            case 'customer':
                return {
                    maKH: groupedItem.group_key,
                    tenKH: groupedItem.group_value,
                    tongSLTon: groupedItem.total_available_quantity,
                    tongSLGoc: groupedItem.total_initial_quantity,
                    soSP: groupedItem.total_unique_products,
                    soPO: groupedItem.total_pos,
                    soKhuVuc: groupedItem.total_locations,
                    soPallet: groupedItem.total_pallets,
                    soThung: groupedItem.total_containers,
                    ngayNhapSomNhat: groupedItem.last_received
                };

            default:
                return item;
        }
    }
}