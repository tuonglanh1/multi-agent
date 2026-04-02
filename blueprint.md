# Agent Blueprint & Plan

## Tasks
- Tạo Migration cho Entity Transaction và cập nhật quan hệ với Bill.
- Tạo các DTO cho Transaction (Create, Update, Read).
- Viết Service logic cho Transaction (findAll, findById).
- Viết Controller và định nghĩa các Endpoint cho Transaction.
- Viết Unit/E2E Tests cho Transaction Service và Controller.

## Blueprint JSON
```json
{
  "module": {
    "name": "Transaction",
    "description": "Quản lý các giao dịch tài chính.",
    "models": [
      {
        "name": "Transaction",
        "description": "Lưu trữ thông tin chi tiết về một giao dịch.",
        "fields": [
          {
            "name": "id",
            "type": "string",
            "isPrimary": true,
            "isUnique": true,
            "isAuto": true
          },
          {
            "name": "amount",
            "type": "number",
            "isRequired": true
          },
          {
            "name": "currency",
            "type": "string",
            "isRequired": true,
            "defaultValue": "VND"
          },
          {
            "name": "status",
            "type": "string",
            "isRequired": true,
            "enumValues": [
              "PENDING",
              "COMPLETED",
              "FAILED",
              "REFUNDED"
            ],
            "defaultValue": "PENDING"
          },
          {
            "name": "transactionDate",
            "type": "Date",
            "isRequired": true
          },
          {
            "name": "paymentMethod",
            "type": "string",
            "isRequired": true
          },
          {
            "name": "description",
            "type": "string",
            "isRequired": false
          },
          {
            "name": "createdAt",
            "type": "Date",
            "isRequired": true,
            "isAuto": true
          },
          {
            "name": "updatedAt",
            "type": "Date",
            "isRequired": true,
            "isAuto": true
          }
        ],
        "relations": [
          {
            "type": "ManyToOne",
            "targetEntity": "Bill",
            "joinColumn": "billId",
            "inverseSide": "transactions"
          }
        ]
      }
    ],
    "workflows": [
      {
        "actionName": "findAllTransactions",
        "description": "Tìm tất cả các giao dịch.",
        "inputs": [],
        "returns": "Transaction[]"
      },
      {
        "actionName": "findTransactionById",
        "description": "Tìm chi tiết một giao dịch theo ID.",
        "inputs": [
          "id: string"
        ],
        "returns": "Transaction"
      }
    ],
    "endpoints": [
      {
        "method": "GET",
        "path": "/transactions",
        "workflow": "findAllTransactions",
        "authRequired": true,
        "roles": [
          "admin"
        ]
      },
      {
        "method": "GET",
        "path": "/transactions/:id",
        "workflow": "findTransactionById",
        "authRequired": true,
        "roles": [
          "admin"
        ]
      }
    ]
  }
}
```
