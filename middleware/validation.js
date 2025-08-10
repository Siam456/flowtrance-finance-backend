import Joi from "joi";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    next();
  };
};

// Export validateRequest as an alias for validate
export const validateRequest = validate;

// Validation schemas
export const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const transactionSchemas = {
  create: Joi.object({
    type: Joi.string().valid("income", "expense", "transfer").required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().min(1).max(200).required(),
    category: Joi.string().min(1).max(50).required(),
    accountId: Joi.string().required(),
    date: Joi.date().max("now").required(),
    time: Joi.string().optional(),
  }),

  update: Joi.object({
    type: Joi.string().valid("income", "expense", "transfer"),
    amount: Joi.number().positive(),
    description: Joi.string().min(1).max(200),
    category: Joi.string().min(1).max(50),
    accountId: Joi.string(),
    date: Joi.date().max("now"),
    time: Joi.string().optional(),
  }),
};

export const accountSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    type: Joi.string().valid("bank", "cash", "credit", "mobile").required(),
    balance: Joi.number().min(0).default(0),
    currency: Joi.string()
      .valid("USD", "EUR", "GBP", "JPY", "CAD", "AUD")
      .default("USD"),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    type: Joi.string().valid("bank", "cash", "credit", "mobile"),
    balance: Joi.number().min(0),
    currency: Joi.string().valid("USD", "EUR", "GBP", "JPY", "CAD", "AUD"),
    isActive: Joi.boolean(),
  }),

  transfer: Joi.object({
    fromAccountId: Joi.string().required(),
    toAccountId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(200).optional(),
  }),
};

export const budgetSchemas = {
  create: Joi.object({
    category: Joi.string().min(1).max(50).required(),
    amount: Joi.number().positive().required(),
    month: Joi.string()
      .pattern(/^\d{4}-\d{2}$/)
      .required(),
  }),

  update: Joi.object({
    category: Joi.string().min(1).max(50),
    amount: Joi.number().positive(),
    month: Joi.string().pattern(/^\d{4}-\d{2}$/),
  }),
};

export const fixedExpenseSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().min(1).max(50).required(),
    dueDate: Joi.date().required(),
    accountId: Joi.string().required(),
    isPaid: Joi.boolean().default(false),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(100),
    amount: Joi.number().positive(),
    category: Joi.string().min(1).max(50),
    dueDate: Joi.date(),
    accountId: Joi.string(),
    isPaid: Joi.boolean(),
    isActive: Joi.boolean(),
  }),
};

export const possibleExpenseSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    expectedAmount: Joi.number().positive().required(),
    category: Joi.string().min(1).max(50).required(),
    accountId: Joi.string().required(),
    notes: Joi.string().max(500).optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(100),
    expectedAmount: Joi.number().positive(),
    category: Joi.string().min(1).max(50),
    accountId: Joi.string(),
    notes: Joi.string().max(500),
  }),

  convert: Joi.object({
    amount: Joi.number().positive().optional(),
    description: Joi.string().max(200).optional(),
    date: Joi.date().optional(),
  }),
};

export const targetSavingsSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    targetAmount: Joi.number().positive().required(),
    accountId: Joi.string().required(),
    description: Joi.string().max(500).allow("").optional(),
    color: Joi.string()
      .pattern(/^#[0-9A-F]{6}$/i)
      .optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(100),
    targetAmount: Joi.number().positive(),
    accountId: Joi.string(),
    description: Joi.string().max(500).allow(""),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    isActive: Joi.boolean(),
  }),
};

export const transferSchemas = {
  transfer: Joi.object({
    fromAccountId: Joi.string().required(),
    toAccountId: Joi.string().required(),
    amount: Joi.number().positive().required(),
  }),
};

export const borrowingSchemas = {
  create: Joi.object({
    personName: Joi.string().min(1).max(100).required(),
    type: Joi.string().valid("borrowed", "lent").required(),
    amount: Joi.number().positive().required(),
    accountId: Joi.string().required(),
    description: Joi.string().max(500).allow("").optional(),
    transactionDate: Joi.date().optional(),
    dueDate: Joi.string().optional(),
  }),
  update: Joi.object({
    personName: Joi.string().min(1).max(100),
    type: Joi.string().valid("borrowed", "lent"),
    amount: Joi.number().positive(),
    accountId: Joi.string(),
    description: Joi.string().max(500).allow(""),
    transactionDate: Joi.date(),
    dueDate: Joi.string().optional(),
  }),
};
