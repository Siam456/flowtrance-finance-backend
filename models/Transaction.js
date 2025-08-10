import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["income", "expense", "transfer"],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      default: () => {
        // Get current time in system's detected timezone
        const now = new Date();
        return now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          // Auto-detect system timezone
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, date: 1, type: 1 });

// Virtual for formatted amount
transactionSchema.virtual("formattedAmount").get(function () {
  if (this.type === "income") {
    return `+$${this.amount.toFixed(2)}`;
  } else if (this.type === "expense") {
    return `-$${this.amount.toFixed(2)}`;
  } else if (this.type === "transfer") {
    return `↔$${this.amount.toFixed(2)}`;
  }
  return `$${this.amount.toFixed(2)}`;
});

// Static method to get user transactions with filters
transactionSchema.statics.getUserTransactions = async function (
  userId,
  filters = {}
) {
  const query = { userId };

  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.accountId) {
    query.accountId = filters.accountId;
  }

  return await this.find(query)
    .sort({ date: -1, createdAt: -1 })
    .populate("accountId", "name type")
    .limit(filters.limit || 100);
};

// Static method to get analytics data
transactionSchema.statics.getAnalytics = async function (
  userId,
  startDate,
  endDate
) {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          type: "$type",
          category: "$category",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.type",
        categories: {
          $push: {
            category: "$_id.category",
            total: "$total",
            count: "$count",
          },
        },
        totalAmount: { $sum: "$total" },
        totalCount: { $sum: "$count" },
      },
    },
  ];

  return await this.aggregate(pipeline);
};

// Static method to get monthly summary
transactionSchema.statics.getMonthlySummary = async function (
  userId,
  year,
  month
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ];

  return await this.aggregate(pipeline);
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
