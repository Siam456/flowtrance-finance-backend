import mongoose from "mongoose";

const borrowingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["borrowed", "lent"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidDate: {
      type: Date,
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

// Link to repayment transaction (created when marked as paid)
borrowingSchema.add({
  repaymentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
});

// Indexes for better query performance
borrowingSchema.index({ userId: 1, type: 1 });
borrowingSchema.index({ userId: 1, isActive: 1 });
borrowingSchema.index({ userId: 1, isPaid: 1 });

// Virtual for calculating net amount (positive for borrowed, negative for lent)
borrowingSchema.virtual("netAmount").get(function () {
  return this.type === "borrowed" ? this.amount : -this.amount;
});

// Method to get summary for a user
borrowingSchema.statics.getUserSummary = async function (userId) {
  const activeBorrowings = await this.find({
    userId,
    isActive: true,
  }).populate("accountId", "name balance");

  const totalBorrowed = activeBorrowings
    .filter((b) => b.type === "borrowed" && !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalLent = activeBorrowings
    .filter((b) => b.type === "lent" && !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const netAmount = totalBorrowed - totalLent;

  return {
    totalBorrowed,
    totalLent,
    netAmount,
    activeCount: activeBorrowings.filter((b) => !b.isPaid).length,
    totalCount: activeBorrowings.length,
  };
};

// Method to get person summary
borrowingSchema.statics.getPersonSummary = async function (userId, personName) {
  const personBorrowings = await this.find({
    userId,
    personName: { $regex: new RegExp(personName, "i") },
    isActive: true,
  });

  const totalBorrowed = personBorrowings
    .filter((b) => b.type === "borrowed" && !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalLent = personBorrowings
    .filter((b) => b.type === "lent" && !b.isPaid)
    .reduce((sum, b) => sum + b.amount, 0);

  const netAmount = totalBorrowed - totalLent;

  return {
    personName,
    totalBorrowed,
    totalLent,
    netAmount,
    transactions: personBorrowings.length,
  };
};

export default mongoose.model("Borrowing", borrowingSchema);
