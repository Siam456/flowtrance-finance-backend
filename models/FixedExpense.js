import mongoose from "mongoose";

const fixedExpenseSchema = new mongoose.Schema(
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
    amount: {
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
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
fixedExpenseSchema.index({ userId: 1, isActive: 1 });
fixedExpenseSchema.index({ userId: 1, dueDate: 1 });
fixedExpenseSchema.index({ userId: 1, isPaid: 1 });

// Virtual for formatted amount
fixedExpenseSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(this.amount);
});

// Method to toggle paid status
fixedExpenseSchema.methods.togglePaid = async function () {
  this.isPaid = !this.isPaid;
  return await this.save();
};

// Static method to get user's fixed expenses
fixedExpenseSchema.statics.getUserFixedExpenses = async function (userId) {
  return await this.find({ userId, isActive: true })
    .populate("accountId", "name type")
    .sort({ dueDate: 1, title: 1 });
};

// Static method to get upcoming fixed expenses
fixedExpenseSchema.statics.getUpcomingExpenses = async function (userId) {
  const today = new Date();
  const currentDay = today.getDate();

  return await this.find({
    userId,
    isActive: true,
    isPaid: false,
    dueDate: { $gte: currentDay },
  })
    .populate("accountId", "name type")
    .sort({ dueDate: 1, title: 1 });
};

const FixedExpense = mongoose.model("FixedExpense", fixedExpenseSchema);

export default FixedExpense;
