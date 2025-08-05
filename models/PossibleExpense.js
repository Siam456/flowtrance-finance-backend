import mongoose from "mongoose";

const possibleExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    expectedAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
possibleExpenseSchema.index({ userId: 1, category: 1 });
possibleExpenseSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted expected amount
possibleExpenseSchema.virtual("formattedExpectedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(this.expectedAmount);
});

// Static method to get user's possible expenses
possibleExpenseSchema.statics.getUserPossibleExpenses = async function (
  userId
) {
  return await this.find({ userId })
    .populate("accountId", "name type")
    .sort({ createdAt: -1 });
};

// Static method to get possible expenses by category
possibleExpenseSchema.statics.getByCategory = async function (
  userId,
  category
) {
  return await this.find({ userId, category })
    .populate("accountId", "name type")
    .sort({ expectedAmount: -1 });
};

const PossibleExpense = mongoose.model(
  "PossibleExpense",
  possibleExpenseSchema
);

export default PossibleExpense;
