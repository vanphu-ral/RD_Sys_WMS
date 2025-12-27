// inventory-graphql.service.ts - FIXED VERSION
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface InventoryItem {
    id: string;
    identifier: string | null;
    serialPallet: string | null;
    locationId: number | null;
    parentLocationId: number | null;
    lastLocationId: number | null;
    parentInventoryId: number | null;
    expirationDate: string | null;
    receivedDate: string | null;
    updatedDate: string | null;
    updatedBy: string | null;
    calculatedStatus: string | null;
    manufacturingDate: string | null;
    initialQuantity: number | null;
    availableQuantity: number | null;
    quantity: number | null;
    name: string | null;
    sapCode: string | null;
    po: string | null;
    lot: string | null;
    vendor: string | null;
    msdLevel: string | null;
    comments: string | null;
}

export interface PaginationMeta {
    totalItems: number;
    totalPages: number;
    page: number;
    size: number;
}

export interface AllInventoriesResponse {
    data: InventoryItem[];
    meta: PaginationMeta;
}

export interface InventoryGroupedAreaItem {
    groupKey: string;
    groupValue: string;
    totalAvailableQuantity: number;
    itemCount: number;
    totalUniqueProducts: number;
    totalClients: number;
    totalPos: number;
    totalPallets: number;
    totalContainers: number;
    totalLocations: number;
}
export interface InventoryGroupedSapCodeItem {
    groupKey: string;
    groupValue: string;
    totalAvailableQuantity: number;
    totalInitialQuantity: number;
    itemCount: number;
    totalClients: number;
    totalPos: number;
    totalPallets: number;
    totalContainers: number;
    totalLocations: number;
    lastUpdated: string;
    lastReceived: string;
}
export interface InventoryGroupedPoItem {
    groupKey: string;
    groupValue: string;
    totalAvailableQuantity: number;
    itemCount: number;
    totalPos: number;
    totalPallets: number;
}

export interface InventoryGroupedClientItem {
    groupKey: string;
    groupValue: string;
    totalAvailableQuantity: number;
    itemCount: number;
    totalClients: number;
}

export interface InventoryGroupedMeta {
    totalItems: number;
}


// GraphQL Queries - KHỚP VỚI BACKEND
const ALL_INVENTORIES_QUERY = gql`
  query AllInventories(
    $page: Int
    $size: Int
    $identifier: String
    $po: String
  ) {
    allInventories(
      page: $page
      size: $size
      identifier: $identifier
      po: $po
    ) {
       data {
        id
        identifier
        serialPallet
        locationId
        parentLocationId
        lastLocationId
        parentInventoryId
        expirationDate
        receivedDate
        updatedDate
        updatedBy
        calculatedStatus
        manufacturingDate
        initialQuantity
        availableQuantity
        quantity
        name
        sapCode
        po
        lot
        vendor
        msdLevel
        comments
      }
      meta {
        totalItems
        totalPages
        page
        size
      }
    }
  }
`;

const INVENTORY_GROUPED_AREA_QUERY = gql`
  query InventoryDashboardGroupedArea {
    inventoryDashboardGrouped(groupBy: "area") {
      data {
        groupKey
        groupValue
        totalAvailableQuantity
        itemCount
        totalUniqueProducts
        totalClients
        totalPos
        totalPallets
        totalContainers
        totalLocations
      }
      meta {
        totalItems
      }
    }
  }
`;

const INVENTORY_GROUPED_PO_QUERY = gql`
  query InventoryDashboardGroupedPo {
    inventoryDashboardGrouped(groupBy: "po") {
      data {
        groupKey
        groupValue
        totalAvailableQuantity
        itemCount
        totalPos
        totalPallets
      }
      meta {
        totalItems
      }
    }
  }
`;
const INVENTORY_GROUPED_CLIENT_QUERY = gql`
  query InventoryDashboardGroupedClient {
    inventoryDashboardGrouped(groupBy: "client") {
      data {
        groupKey
        groupValue
        totalAvailableQuantity
        itemCount
        totalClients
      }
      meta {
        totalItems
      }
    }
  }
`;
const INVENTORY_GROUPED_SAPCODE_QUERY = gql`
    query {
  inventoryDashboardGrouped(
    groupBy: "sap_code",
    page: 1,
    size: 10
  ) {
    data {
      groupKey
      groupValue
      totalAvailableQuantity
      totalInitialQuantity
      itemCount
      totalClients
      totalPos
      totalPallets
      totalContainers
      totalLocations
      lastUpdated
      lastReceived
    }
    meta {
      totalItems
      totalPages
      page
      size
    }
  }
}`;

@Injectable({
    providedIn: 'root'
})
export class InventoryGraphqlService {
    constructor(private apollo: Apollo) {
        console.log('[InventoryGraphqlService] Initialized');
    }

    getAllInventories(args: {
        page?: number;
        size?: number;
        identifier?: string;
        po?: string;
    }) {
        return this.apollo.query<{ allInventories: AllInventoriesResponse }>({
            query: ALL_INVENTORIES_QUERY,
            variables: args,
            fetchPolicy: 'network-only'
        });
    }

    getGroupedSapCode() {
        return this.apollo.query<{ inventoryDashboardGrouped: { data: InventoryGroupedSapCodeItem[]; meta: InventoryGroupedMeta } }>({
            query: INVENTORY_GROUPED_SAPCODE_QUERY,
            fetchPolicy: 'network-only'
        });
    }
    getGroupedArea() {
        return this.apollo.query<{ inventoryDashboardGrouped: { data: InventoryGroupedAreaItem[]; meta: InventoryGroupedMeta } }>({
            query: INVENTORY_GROUPED_AREA_QUERY,
            fetchPolicy: 'network-only'
        });
    }

    getGroupedPo() {
        return this.apollo.query<{ inventoryDashboardGrouped: { data: InventoryGroupedPoItem[]; meta: InventoryGroupedMeta } }>({
            query: INVENTORY_GROUPED_PO_QUERY,
            fetchPolicy: 'network-only'
        });
    }

    getGroupedClient() {
        return this.apollo.query<{ inventoryDashboardGrouped: { data: InventoryGroupedClientItem[]; meta: InventoryGroupedMeta } }>({
            query: INVENTORY_GROUPED_CLIENT_QUERY,
            fetchPolicy: 'network-only'
        });
    }

}