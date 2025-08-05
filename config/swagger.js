import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Flowtrance Finance API",
      version: "1.0.0",
      description:
        "A comprehensive financial management API for tracking expenses, income, budgets, and financial analytics",
      contact: {
        name: "Flowtrance Finance",
        email: "support@flowtrance.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://api.flowtrance.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: { type: "string", example: "John Doe" },
            settings: {
              type: "object",
              properties: {
                currency: { type: "string", example: "USD" },
                timezone: { type: "string", example: "America/New_York" },
                theme: {
                  type: "string",
                  enum: ["light", "dark"],
                  example: "light",
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Account: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "Main Bank Account" },
            type: {
              type: "string",
              enum: ["bank", "cash", "credit", "mobile"],
              example: "bank",
            },
            balance: { type: "number", example: 5000.0 },
            currency: { type: "string", example: "USD" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            accountId: { type: "string", example: "507f1f77bcf86cd799439011" },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "expense",
            },
            amount: { type: "number", example: 150.0 },
            description: { type: "string", example: "Grocery shopping" },
            category: { type: "string", example: "Food & Dining" },
            date: { type: "string", format: "date", example: "2024-01-15" },
            time: { type: "string", example: "14:30" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Budget: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            category: { type: "string", example: "Food & Dining" },
            amount: { type: "number", example: 500.0 },
            month: { type: "string", example: "2024-01" },
            spent: { type: "number", example: 350.0 },
            remaining: { type: "number", example: 150.0 },
            percentage: { type: "number", example: 70 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        FixedExpense: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: { type: "string", example: "Rent Payment" },
            amount: { type: "number", example: 1200.0 },
            category: { type: "string", example: "Housing" },
            dueDate: { type: "number", example: 1 },
            accountId: { type: "string", example: "507f1f77bcf86cd799439011" },
            isPaid: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PossibleExpense: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: { type: "string", example: "Vacation Trip" },
            expectedAmount: { type: "number", example: 2000.0 },
            category: { type: "string", example: "Travel" },
            accountId: { type: "string", example: "507f1f77bcf86cd799439011" },
            notes: { type: "string", example: "Planning for summer vacation" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Budget: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            category: { type: "string", example: "Food & Dining" },
            amount: { type: "number", example: 500.0 },
            month: { type: "string", example: "2024-01" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        FixedExpense: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            userId: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: { type: "string", example: "Rent Payment" },
            amount: { type: "number", example: 1200.0 },
            category: { type: "string", example: "Housing" },
            dueDate: { type: "string", format: "date", example: "2024-01-15" },
            accountId: { type: "string", example: "507f1f77bcf86cd799439011" },
            isPaid: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        DashboardData: {
          type: "object",
          properties: {
            accounts: {
              type: "array",
              items: { $ref: "#/components/schemas/Account" },
            },
            transactions: {
              type: "array",
              items: { $ref: "#/components/schemas/Transaction" },
            },
            fixedExpenses: {
              type: "array",
              items: { $ref: "#/components/schemas/FixedExpense" },
            },
            possibleExpenses: {
              type: "array",
              items: { $ref: "#/components/schemas/PossibleExpense" },
            },
            budgets: {
              type: "array",
              items: { $ref: "#/components/schemas/Budget" },
            },
            analytics: {
              type: "object",
              properties: {
                totalIncome: { type: "number", example: 5000.0 },
                totalExpenses: { type: "number", example: 3200.0 },
                netSavings: { type: "number", example: 1800.0 },
                savingsRate: { type: "number", example: 36 },
                categoryBreakdown: {
                  type: "object",
                  additionalProperties: { type: "number" },
                },
                monthlyTrend: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", example: "2024-01" },
                      income: { type: "number", example: 5000.0 },
                      expenses: { type: "number", example: 3200.0 },
                    },
                  },
                },
              },
            },
            summary: {
              type: "object",
              properties: {
                totalBalance: { type: "number", example: 15000.0 },
                monthlyIncome: { type: "number", example: 5000.0 },
                monthlyExpenses: { type: "number", example: 3200.0 },
                upcomingExpenses: { type: "number", example: 1200.0 },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Error message" },
            code: { type: "string", example: "VALIDATION_ERROR" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Dashboard",
        description: "Main dashboard data and analytics",
      },
      {
        name: "Transactions",
        description: "Financial transaction management",
      },
      {
        name: "Accounts",
        description: "Financial account management",
      },
      {
        name: "Budgets",
        description: "Budget planning and tracking",
      },
      {
        name: "Fixed Expenses",
        description: "Recurring expense management",
      },
      {
        name: "Possible Expenses",
        description: "Planned future expenses",
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const specs = swaggerJsdoc(options);

export default specs;
