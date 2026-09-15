# 06_DATABASE_DESIGN.md - Business Entity & Domain-Driven Design

# BitCommerce Domain-Driven Business Entity Design

**Version:** 0.2.0  
**Status:** Approved  
**Architecture Style:** Domain-Driven Design (DDD) Entity Modeling  

---

## 1. Overview & Architectural Principles

This document defines the **Business Entity Design** for BitCommerce. In alignment with Domain-Driven Design (DDD) and Modular Monolith principles:

* **Business Modeling First**: Focuses strictly on domain boundaries, entity responsibilities, ownership, aggregate roots, and relationships. Physical database column definitions, SQL data types, and migrations are intentionally deferred to implementation.
* **Strict Module Decoupling**: Modules (e.g., Catalog vs. Inventory) do NOT share internal database state or perform cross-domain joins.
* **Decoupled Inventory Domain**: The `Catalog` domain (Products/Variants) is explicitly decoupled from stock control. `Catalog` manages product definitions, presentation, and SEO, while the `Inventory` domain independently manages physical stock, warehouse locations, and stock reservations.
* **Multi-Tenancy Isolation**: All domain aggregates enforce tenant scope ownership via `tenant_id` context.

---

## 2. High-Level Entity Relationship Topology

```
Tenant Domain (Aggregate: Tenant)
└── Store
    ├── Catalog Domain (Aggregate: Product)
    ├── Inventory Domain (Aggregate: Inventory) [DECOUPLED]
    ├── Customer Domain (Aggregate: Customer)
    ├── Sales Domain (Aggregate: Order)
    ├── Shipping Domain (Aggregate: Shipment)
    └── Marketing Domain (Aggregate: Coupon)
```

---

## 3. Domain Entity Specifications

---

### 3.1 Identity Domain

#### Aggregate Root
* `User`

#### Entities
* `User`, `Role`, `Permission`, `Session`, `RefreshToken`

#### Entity Responsibilities & Boundaries
* **`User`**: Core identity account across the platform. Manages global profile, credentials, and authentication state. Does NOT manage store-level customer orders.
* **`Role`**: Represents RBAC roles (`StoreOwner`, `StoreManager`, `FulfillmentStaff`).
* **`Permission`**: Granular action permissions attached to roles.
* **`Session` / `RefreshToken`**: Auth token lifecycles, active device sessions, and security revocation.

#### Ownership & Scope
* **Global Scope**: `User`, `RefreshToken`
* **Tenant Scope**: Tenant-specific role assignments via `UserRole`.

---

### 3.2 Tenant Domain

#### Aggregate Root
* `Tenant`

#### Entities
* `Tenant`, `Store`, `Domain`, `Subscription`, `SubscriptionPlan`

#### Entity Responsibilities & Boundaries
* **`Tenant`**: Root organization account holding multi-tenant isolation context.
* **`Store`**: Individual storefront instance under a tenant organization.
* **`Domain`**: Custom domain binding (`merchant.com`) and subdomains (`merchant.bitcommerce.app`) with SSL status.
* **`Subscription` & `SubscriptionPlan`**: SaaS billing tier, usage quotas, feature flags, and renewal status.

#### Relationships
```
Tenant (1) ───< (N) Store
Tenant (1) ───< (N) Domain
Tenant (1) ──── (1) Subscription ───> (1) SubscriptionPlan
```

---

### 3.3 Catalog Domain

#### Aggregate Root
* `Product`

#### Entities
* `Product`, `ProductVariant`, `ProductImage`, `Category`, `Brand`, `Collection`, `Tag`, `Attribute`, `AttributeValue`

#### Entity Responsibilities & Boundaries
* **`Product`**:
  * **Responsible for**: Title, slug, description, visibility status (Draft/Published), SEO metadata, brand association.
  * **Does NOT manage**: Physical inventory counts, stock reservation, customer reviews, order history.
* **`ProductVariant`**: Specific sellable SKU combination (e.g. Size: XL, Color: Blue) with pricing details (`price`, `compare_at_price`).
* **`Attribute` / `AttributeValue`**: Dynamic product attributes (Size, Color, Material).
* **`Category` / `Brand` / `Collection` / `Tag`**: Classification and grouping structures for storefront navigation.

#### Relationships & Ownership (Tenant Scoped)
```
Category (1) ───< (N) Product
Brand (1) ──────< (N) Product
Product (1) ────< (N) ProductVariant
Product (1) ────< (N) ProductImage
Product (N) >───< (N) Collection
ProductVariant (N) >───< (N) AttributeValue
```

---

### 3.4 Inventory Domain (Decoupled Module)

#### Aggregate Root
* `Inventory`

#### Entities
* `Inventory`, `InventoryTransaction`, `Warehouse`, `Supplier`

#### Entity Responsibilities & Boundaries
* **`Inventory`**:
  * **Responsible for**: Tracking available stock, reserved stock (active checkouts), safety stock levels, and reorder alerts.
  * **Does NOT manage**: Product display titles, prices, descriptions, images, or storefront themes.
* **`InventoryTransaction`**: Immutable audit log of stock movements (Restock, Order Reservation, Sale Deduction, Damage Adjustment, Return).
* **`Warehouse`**: Physical storage location (Dhaka Central Warehouse, Chittagong Hub).
* **`Supplier`**: Vendor/supplier profiles for procurement tracking.

#### Relationships & Domain Links
```
Warehouse (1) ───< (N) Inventory
Inventory (1) ───< (N) InventoryTransaction
Supplier (1) ────< (N) Inventory
Inventory references Catalog -> ProductVariant by variant_id (Weak Reference)
```

---

### 3.5 Customer Domain

#### Aggregate Root
* `Customer`

#### Entities
* `Customer`, `Address`, `CustomerGroup`, `Wishlist`

#### Entity Responsibilities & Boundaries
* **`Customer`**: Store-level customer identity, purchase history summary, and loyalty metrics.
* **`Address`**: Saved billing and shipping addresses (District, Thana/Upazila, Union, Street).
* **`CustomerGroup`**: Customer segmentation (VIP, Wholesaler, Repeat Buyer).
* **`Wishlist`**: Customer saved products for future purchase.

---

### 3.6 Sales Domain

#### Aggregate Roots
* `Cart`, `Order`

#### Entities
* `Cart`, `CartItem`, `Order`, `OrderItem`, `OrderStatusHistory`

#### Entity Responsibilities & Boundaries
* **`Cart`**: Transient shopping cart state, guest checkout sessions, item quantities.
* **`Order`**:
  * **Responsible for**: Order lifecycle state (`PENDING`, `CONFIRMED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`), order snapshot prices, customer details snapshot, totals (subtotal, shipping, discount, grand total).
  * **Does NOT manage**: Direct payment gateway handshakes, courier vehicle routing.
* **`OrderItem`**: Immutable snapshot of purchased variants, unit prices, and quantities at moment of order placement.
* **`OrderStatusHistory`**: Timeline of status transitions with actor audit details.

#### Relationships (Tenant Scoped)
```
Customer (1) ───< (N) Order
Order (1) ──────< (N) OrderItem
Order (1) ──────< (N) OrderStatusHistory
OrderItem references Catalog -> ProductVariant by variant_id (Snapshot Copy)
```

---

### 3.7 Payment Domain

#### Aggregate Root
* `Payment`

#### Entities
* `Payment`, `PaymentTransaction`, `Refund`

#### Entity Responsibilities & Boundaries
* **`Payment`**: Payment record linked to an Order, gateway selection (`BKASH`, `NAGAD`, `SSLCOMMERZ`, `COD`), and transaction state.
* **`PaymentTransaction`**: Gateway payload logs, gateway transaction IDs (`trxID`), and API webhook responses.
* **`Refund`**: Partial or full refund requests and settlement status.

---

### 3.8 Shipping Domain

#### Aggregate Root
* `Shipment`

#### Entities
* `Shipment`, `ShipmentTracking`, `Courier`

#### Entity Responsibilities & Boundaries
* **`Shipment`**: Order package fulfillment details, consignment ID, shipping label URL, package weight.
* **`ShipmentTracking`**: Real-time status logs received from courier APIs.
* **`Courier`**: Integrated delivery partner configuration (Steadfast, Pathao, RedX, Paperfly).

---

### 3.9 Marketing Domain

#### Aggregate Root
* `Coupon`, `Campaign`

#### Entities
* `Coupon`, `CouponUsage`, `Campaign`, `Banner`

#### Entity Responsibilities & Boundaries
* **`Coupon`**: Discount rules (percentage/fixed, minimum order value, validity dates).
* **`CouponUsage`**: Tracks customer usage count against coupon limits.
* **`Campaign` / `Banner`**: Promotional banner graphics and marketing campaign definitions.

---

### 3.10 CMS Domain

#### Aggregate Root
* `Page`

#### Entities
* `Page`, `Blog`, `Menu`

#### Entity Responsibilities & Boundaries
* **`Page`**: Custom store pages (About Us, Contact Us, Privacy Policy, Terms).
* **`Blog`**: Merchant blog posts, articles, and news releases.
* **`Menu`**: Storefront navigation header/footer link structures.

---

### 3.11 System Domain

#### Aggregate Root
* System (Global Utility Scope)

#### Entities
* `Notification`, `AuditLog`, `Media`, `Setting`

#### Entity Responsibilities & Boundaries
* **`Notification`**: System push alerts, SMS queue logs, and email delivery receipts.
* **`AuditLog`**: System-wide administrative action logs for security and compliance.
* **`Media`**: Shared image/file attachment registry with S3 storage keys and image metadata.
* **`Setting`**: Storefront configuration parameters (currency formats, timezones, store contacts).

---

## 4. Domain Boundary & Intercommunication Rules

1. **No Cross-Domain Direct DB Joins**: The `Sales` module MUST NOT perform SQL JOINs directly against `Catalog` or `Inventory` tables.
2. **Weak References via IDs**: Cross-domain references use String/UUID identifiers (`variant_id`, `customer_id`, `warehouse_id`).
3. **Data Snapshots**: Entities like `OrderItem` snapshot the variant title, SKU, and unit price at checkout time to remain resilient against future catalog edits.
4. **Decoupled Stock Updates**: When an order is placed, `Sales` emits an `OrderPlacedEvent`. The `Inventory` module listens to this event to execute stock reservation asynchronously without tight coupling.
