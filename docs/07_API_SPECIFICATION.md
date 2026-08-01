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

