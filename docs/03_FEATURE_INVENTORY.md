# 03_FEATURE_INVENTORY.md - Detailed Feature Inventory

# EasyCommerce Feature Inventory & Module Mapping

**Version:** 0.1.0  
**Status:** Draft  

---

## Module Breakdown

### 1. Identity Module
* **IDN-001 Authentication**: Email/Password, Social Auth (Google, Facebook), OTP via SMS (BD operators).
* **IDN-002 Authorization & RBAC**: Roles (SuperAdmin, Store Owner, Store Manager, Order Fulfillment, Accountant), custom permissions.
* **IDN-003 Security**: MFA, Session management, Password reset & email verification.

### 2. Tenant & Organization Module
* **TNT-001 Store Management**: Multi-store creation under a single merchant account.
* **TNT-002 Domain Management**: Subdomains (`merchant.easycommerce.app`) & Custom domain mapping (`merchant.com` with SSL).
* **TNT-003 Subscriptions**: Tiered plans (Free, Starter, Growth, Enterprise), usage limits, automated subscription renewals.

### 3. Storefront & CMS Module
* **CMS-001 Theme Engine**: Section-based themes, live preview, layout sections.
* **CMS-002 Custom Pages**: Custom pages (About Us, Contact, T&C, Privacy Policy), FAQ builder, Blog manager.
* **CMS-003 Store Settings**: Logo, Favicon, Currency, Language, Social Links, Business Info.

### 4. Catalog & Inventory Module
* **CAT-001 Products & Variants**: Single products, product variants (SKU, Size, Color, Material), variant images, pricing and tax management.
* **CAT-002 Categorization & Hierarchy (Complete)**:
  * Multi-level recursive category hierarchy with visual drag-and-drop tree reordering and circular cycle prevention.
  * Category domain management: Active, Draft, and Archived status workflows with storefront visibility toggles.
  * Media upload integration and structured SEO metadata (Title, Meta Description).
  * Product ↔ Category assignment with correlated product counting, category product tab view, and product list filtering.
  * Merchant bulk management toolbar: batch status switcher, hierarchical bulk move, and safe cascade deletion (product unlinking).
  * Two-stage RFC 4180 CSV import with live validation preview, duplicate detection, and topological transaction execution; formula-sanitized UTF-8 CSV exporter.
* **INV-001 Inventory Management (Decoupled)**: Multi-warehouse stock tracking, low stock alerts, stock adjustment logs.

### 5. Sales & Order Module
* **SAL-001 Cart & Checkout**: Single-page checkout, guest checkout, saved cart sessions.
* **SAL-002 Order Pipeline**: Order lifecycle (Pending, Processing, Shipped, Delivered, Cancelled, Refunded), bulk actions, order timeline.
* **SAL-003 Promotions**: Coupon codes, percentage/fixed discounts, minimum order value triggers, buy-X-get-Y.

### 6. Customer & CRM Module
* **CST-001 Customer Accounts**: Order history, saved addresses, wishlist.
* **CST-002 CRM & Segmentation**: Customer segmentation (VIP, Repeat, Inactive), customer notes, store credit/loyalty points.

### 7. Payment Module
* **PAY-001 Local Gateways**: bKash, Nagad, Rocket, Upay, SSLCommerz, Shurjopay, Foster Payments.
* **PAY-002 Cash on Delivery (COD)**: Native COD option with automated phone verification OTP to prevent fake orders.
* **PAY-003 Refunds & Webhooks**: Instant webhooks for payment status, partial/full refund handling.

### 8. Shipping & Fulfillment Module
* **SHP-001 Courier Integrations**: Pathao, Steadfast, RedX, Paperfly direct API connections.
* **SHP-002 Fulfillment**: One-click shipment booking, shipping label & invoice generation, real-time package tracking.
* **SHP-003 Shipping Rules**: Flat rate, weight-based, location-based (Inside Dhaka / Outside Dhaka).

### 9. Marketing & Analytics Module
* **MKT-001 Tracking & Pixels**: Facebook Pixel & Conversion API (CAPI), Google Analytics 4, TikTok Pixel.
* **MKT-002 Marketing Campaigns**: SMS marketing integration, abandoned cart recovery notifications.

### 10. Reports & Business Intelligence
* **REP-001 Dashboard Analytics**: Real-time sales, order breakdown, conversion rates, top-selling products.
* **REP-002 Exportable Reports**: Sales reports, tax reports, inventory valuation, customer summaries.

### 11. System & Utility Module
* **SYS-001 Notifications**: Email notifications (Resend/SMTP), SMS alerts, system push notifications.
* **SYS-002 Audit Logs**: Activity logs for store actions and configuration changes.
* **SYS-003 Search & Media Storage**: Full-text search, media library with S3 image optimization.


---

## Permission Matrix (RBAC)

| Module / Feature | SuperAdmin | Store Owner | Store Manager | Order Fulfillment | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Store & Tenant Settings** | ✅ | ✅ | Read Only | ❌ | ❌ |
| **Catalog & Products** | ✅ | ✅ | Manage | Read Only | Read Only |
| **Inventory Management** | ✅ | ✅ | Manage | Manage | Read Only |
| **Orders & Checkout** | ✅ | ✅ | Manage | Process & Fulfill | Read Only |
| **Payments & Refunds** | ✅ | ✅ | View & Refund | ❌ | View & Refund |
| **Shipping & Courier Booking** | ✅ | ✅ | Manage | Book & Print Labels | ❌ |
| **Customer Data & CRM** | ✅ | ✅ | View & Manage | View Addresses | Read Only |
| **Billing & Subscriptions** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Staff & Role Management** | ✅ | ✅ | ❌ | ❌ | ❌ |

