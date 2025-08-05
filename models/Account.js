import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ["bank", "cash", "credit", "mobile"],
      default: "bank",
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"],
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
accountSchema.index({ userId: 1, isActive: 1 });
accountSchema.index({ userId: 1, type: 1 });

// Virtual for formatted balance
accountSchema.virtual("formattedBalance").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: this.currency,
  }).format(this.balance);
});

// Method to update balance
accountSchema.methods.updateBalance = async function (amount) {
  this.balance += amount;
  return await this.save();
};

// Method to get account summary
accountSchema.methods.getSummary = function () {
  return {
    id: this._id,
    name: this.name,
    type: this.type,
    balance: this.balance,
    currency: this.currency,
    formattedBalance: this.formattedBalance,
    isActive: this.isActive,
  };
};

const Account = mongoose.model("Account", accountSchema);

export default Account;
