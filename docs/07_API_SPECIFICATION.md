# 07_API_SPECIFICATION.md - API Specification

# EasyCommerce RESTful API Standard & Endpoint Definitions

**Version:** 0.1.0  
**Status:** Draft  

---

## 1. API Standards & Headers

* Base URL: `https://api.easycommerce.app/v1`
* Content-Type: `application/json`
* Tenant Header: `X-Tenant-ID: <tenant_id_or_slug>` (automatically inferred on custom storefront domains).
* Authorization: `Bearer <jwt_token>`

---

## 2. Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product does not exist.",
    "details": []
  }
}
```

---

## 3. High-Level Endpoint Map

### Authentication & Tenant
* `POST /v1/auth/register` - Merchant registration
* `POST /v1/auth/login` - User login
* `GET /v1/tenant/profile` - Tenant details

### Catalog APIs (Public & Admin)
* `GET /v1/products` - List products (filterable by category, price, search)
* `GET /v1/products/:slug` - Product details
* `POST /v1/admin/products` - Create product (Admin)

### Checkout & Orders
* `POST /v1/cart/checkout` - Initiate checkout & reserve stock
  ```json
  // Request Payload
  {
    "items": [
      { "variantId": "uuid-variant-id", "quantity": 2 }
    ],
    "customer": {
      "name": "Rahim Ahmed",
      "phone": "+8801711000000",
      "address": "House 12, Road 5, Block B",
      "city": "Dhaka",
      "zone": "Mirpur"
    },
    "paymentMethod": "BKASH" | "NAGAD" | "COD"
  }
  ```
* `GET /v1/orders/:id` - Get order status & tracking
* `POST /v1/admin/orders/:id/fulfill` - Trigger courier booking

### Payments — Merchant Dashboard (implemented)
All routes below require `Authorization: Bearer <jwt>` and are scoped to the caller's
tenant server-side. `X-Store-Id` selects the active store for multi-store merchants.
Reads require the `orders:read` permission; export requires `orders:manage`.

* `GET /v1/payments/transactions` - Paginated, filterable, searchable transaction list.
  * Query: `page`, `limit` (max 100), `search`, `status`, `gateway`, `paymentMethod`,
    `dateRange` (`today|yesterday|7d|30d|90d|custom`), `dateFrom`, `dateTo`, `timezone`,
    `minAmount`, `maxAmount`, `currency`, `sortBy`, `sortOrder`.
  * `search` matches transaction number, gateway reference, order number, customer name/phone.
  ```json
  {
    "success": true,
    "data": {
      "data": [{
        "id": "uuid",
        "transactionNumber": "TXN-10245",
        "gatewayTransactionId": "SSLCZ-8F92...",
        "orderId": "uuid",
        "orderNumber": "EC-1024",
        "customer": { "id": "uuid", "name": "Rahim Hossain", "phone": "+8801712345678" },
        "gateway": "SSLCOMMERZ", "gatewayLabel": "SSLCommerz",
        "paymentMethod": "BKASH", "paymentMethodLabel": "bKash",
        "amount": 4500, "refundedAmount": 0, "currency": "BDT",
        "status": "COMPLETED", "isRefundable": true,
        "createdAt": "2025-08-14T04:46:00.000Z", "paidAt": "2025-08-14T04:46:00.000Z"
      }],
      "meta": { "page": 1, "limit": 10, "total": 245, "totalPages": 25 }
    }
  }
  ```
* `GET /v1/payments/transactions/summary` - KPIs, donut overview, top methods, gateways.
  Accepts the same filters (except `page`/`limit`); the `status` filter is deliberately
  **not** applied so the paid/pending/refunded split stays visible while the table is narrowed.
  `changePercent` is `null` when the previous period is zero.
* `GET /v1/payments/transactions/export` - CSV of the **entire filtered set** (not one page),
  capped at 10,000 rows (`X-Export-Row-Count`, `X-Export-Truncated` headers). Requires `orders:manage`.
* `GET /v1/payments/transactions/:id` - Full payment details incl. refunds and lifecycle timeline.
  Returns `404` for another tenant's payment so existence is never leaked.
* `GET /v1/payments/gateways` - The merchant's gateways. Never returns credentials.
* `POST /v1/payments/transactions/seed-demo-data` - Seeds demo data; disabled in production.

### Payment & Courier Webhooks
* `POST /v1/webhooks/payments/bkash` - bKash callback listener
  ```json
  // Callback Payload
  {
    "paymentID": "TR00239102",
    "status": "Completed",
    "trxID": "9A8B7C6D",
    "amount": "1250.00"
  }
  ```
* `POST /v1/webhooks/courier/steadfast` - Delivery status updates

---

## 4. Standard HTTP Status Codes

* `200 OK`: Successful read or update operation.
* `201 Created`: Entity created successfully.
* `400 Bad Request`: Validation error or malformed payload.
* `401 Unauthorized`: Missing or invalid JWT token.
* `403 Forbidden`: Insufficient RBAC permission.
* `404 Not Found`: Resource does not exist under tenant context.
* `422 Unprocessable Entity`: Business logic rule failed (e.g., insufficient stock).
* `500 Internal Error`: Unexpected server failure.

