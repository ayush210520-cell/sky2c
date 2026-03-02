# Google Sheet schema for Shipment Tracking

Use two sheets (tabs) with these exact column names in row 1.

## Sheet: **Shipments**

| A               | B           | C              | D               | E                     | F         | G          | H              | I                   | J          | K          | L                | M              | N               | O                 | P          |
|-----------------|-------------|----------------|-----------------|----------------------|-----------|------------|----------------|--------------------|------------|------------|------------------|----------------|-----------------|-------------------|------------|
| ShipmentNumber  | AssignedTo  | CustomerEmail  | CurrentStatus   | CurrentLocationName  | Latitude  | Longitude  | TransportMode   | PickupLocationName | PickupLat  | PickupLng  | DestinationName  | DestinationLat | DestinationLng  | LastUpdatedTime   | CreatedAt  |

## Sheet: **Shipment Status History**

| A               | B       | C             | D         | E          | F          |
|-----------------|---------|---------------|-----------|------------|------------|
| ShipmentNumber  | Status  | LocationName  | Latitude  | Longitude  | RecordedAt |

Share the sheet with your Google Service Account email (Editor). Set `GOOGLE_SHEET_ID` in backend `.env` to the ID in the sheet URL.
