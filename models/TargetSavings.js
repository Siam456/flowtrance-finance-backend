import mongoose from "mongoose";

const targetSavingsSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
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
    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currentAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Removed monthlyTarget and targetDate to simplify monthly handling

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "#3B82F6", // Blue color
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
targetSavingsSchema.index({ userId: 1, isActive: 1 });

// Virtual for progress percentage
targetSavingsSchema.virtual("progressPercentage").get(function () {
  if (this.targetAmount <= 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for remaining amount
targetSavingsSchema.virtual("remainingAmount").get(function () {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual for monthly progress
targetSavingsSchema.virtual("monthlyProgress").get(function () {
  const now = new Date();
  const startDate = new Date(this.startDate);
  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());
  return Math.max(monthsElapsed, 0);
});

// Method to check if target is exceeded
targetSavingsSchema.methods.isTargetExceeded = function () {
  return this.currentAmount > this.targetAmount;
};

// Method to get target summary
targetSavingsSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    targetAmount: this.targetAmount,
    currentAmount: this.currentAmount,
    accountId: this.accountId?._id || this.accountId,
    accountName: this.accountId?.name,
    progressPercentage: this.progressPercentage,
    remainingAmount: this.remainingAmount,
    isTargetExceeded: this.isTargetExceeded(),
    color: this.color,
    startDate: this.startDate,
    isActive: this.isActive,
  };
};

// Static method to get user's active targets
targetSavingsSchema.statics.getUserTargets = async function (userId) {
  return await this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to get target with spending analysis
targetSavingsSchema.statics.getTargetWithAnalysis = async function (
  targetId,
  userId
) {
  const target = await this.findOne({ _id: targetId, userId });
  if (!target) return null;

  // Get current month's total spending
  // Get total balance from accounts
  const totalBalance = await mongoose.model("Account").aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$balance" },
      },
    },
  ]);

  const totalBalanceAmount = totalBalance[0]?.totalBalance || 0;
  // Spendable without touching savings equals totalBalance - totalCurrentSavings
  const allTargets = await mongoose
    .model("TargetSavings")
    .find({ userId, isActive: true });
  const totalCurrentSavings = allTargets.reduce(
    (sum, t) => sum + (t.currentAmount || 0),
    0
  );
  const availableForSpending = Math.max(
    totalBalanceAmount - totalCurrentSavings,
    0
  );

  return {
    ...target.getSummary(),
    totalBalance: totalBalanceAmount,
    availableForSpending,
  };
};

const TargetSavings = mongoose.model("TargetSavings", targetSavingsSchema);

export default TargetSavings;
