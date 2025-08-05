import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
budgetSchema.index({ userId: 1, month: 1 });
budgetSchema.index({ userId: 1, category: 1 });

// Virtual for formatted amount
budgetSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(this.amount);
});

// Static method to get user budgets for a month
budgetSchema.statics.getUserBudgets = async function (userId, month) {
  return await this.find({ userId, month }).sort({ category: 1 });
};

// Static method to get budget with spending data
budgetSchema.statics.getBudgetWithSpending = async function (userId, month) {
  const budgets = await this.find({ userId, month });

  // Get spending data for the month
  const startDate = new Date(month + "-01");
  const endDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0
  );

  const spendingData = await mongoose.model("Transaction").aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "expense",
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$category",
        spent: { $sum: "$amount" },
      },
    },
  ]);

  // Create a map of spending by category
  const spendingMap = {};
  spendingData.forEach((item) => {
    spendingMap[item._id] = item.spent;
  });

  // Combine budget and spending data
  return budgets.map((budget) => {
    const spent = spendingMap[budget.category] || 0;
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget.toObject(),
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.amount,
    };
  });
};

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
