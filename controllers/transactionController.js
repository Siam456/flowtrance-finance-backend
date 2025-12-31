import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import TargetSavings from "../models/TargetSavings.js";
import {
  updateTargetProgress,
  deductFromSavings,
} from "./targetSavingsController.js";

export const createTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, amount, description, category, accountId, date, time } = req.body;

    // Verify account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Create transaction with explicit time if provided
    const transactionData = {
      userId,
      accountId,
      type,
      amount,
      description,
      category,
      date: new Date(date),
    };

    // Only add time if explicitly provided (from frontend with user's timezone)
    if (time) {
      transactionData.time = time;
    }

    const transaction = new Transaction(transactionData);

    await transaction.save();

    // Update account balance
    const balanceChange = type === "income" ? amount : -amount;
    account.balance += balanceChange;
    await account.save();

    // If expense and overall available-for-spending goes negative, deduct the deficit from savings
    if (type === "expense") {
      // Compute user's total balance and monthly commitment
      const [totalBalanceAgg, activeTargets] = await Promise.all([
        Account.aggregate([
          {
            $match: { userId: account.userId, isActive: true },
          },
          {
            $group: { _id: null, totalBalance: { $sum: "$balance" } },
          },
        ]),
        TargetSavings.find({ userId: account.userId, isActive: true }),
      ]);

      const totalBalance = totalBalanceAgg[0]?.totalBalance || 0;
      const totalMonthlyTarget = activeTargets.reduce(
        (sum, t) => sum + (t.monthlyTarget || 0),
        0
      );
      const availableForSpending = totalBalance - totalMonthlyTarget;

      if (availableForSpending < 0) {
        await deductFromSavings(userId, Math.abs(availableForSpending));
      }
    }

    // Update target savings progress (no-op now; handled by overspend deduction)
    await updateTargetProgress(userId, amount, type);

    // Populate account details for response
    await transaction.populate("accountId", "name type");

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date.toISOString(),
        account: transaction.accountId._id,
        accountName: transaction.accountId.name,
        time: transaction.time,
      },
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      startDate,
      endDate,
      type,
      category,
      accountId,
      limit = 50,
      page = 1,
    } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.startDate = new Date(startDate);
      filters.endDate = new Date(endDate);
    }
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (accountId) filters.accountId = accountId;
    if (limit) filters.limit = parseInt(limit);

    const transactions = await Transaction.getUserTransactions(userId, filters);

    res.json({
      success: true,
      data: transactions.map((transaction) => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date.toISOString(),
        account: transaction?.accountId?._id,
        accountName: transaction?.accountId?.name,
        time: transaction.time,
      })),
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    // Find transaction and verify ownership
    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // If amount or type changed, we need to update account balance
    if (updateData.amount || updateData.type) {
      const oldAmount = transaction.amount;
      const oldType = transaction.type;
      const newAmount = updateData.amount || oldAmount;
      const newType = updateData.type || oldType;

      // Calculate balance adjustment
      const oldBalanceChange = oldType === "income" ? oldAmount : -oldAmount;
      const newBalanceChange = newType === "income" ? newAmount : -newAmount;
      const balanceAdjustment = newBalanceChange - oldBalanceChange;

      // Update account balance
      const account = await Account.findById(transaction.accountId);
      if (account) {
        account.balance += balanceAdjustment;
        await account.save();
      }
    }

    // Update transaction
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("accountId", "name type");

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: {
        id: updatedTransaction._id,
        type: updatedTransaction.type,
        amount: updatedTransaction.amount,
        description: updatedTransaction.description,
        category: updatedTransaction.category,
        date: updatedTransaction.date.toISOString(),
        account: updatedTransaction.accountId._id,
        accountName: updatedTransaction.accountId.name,
        time: updatedTransaction.time,
      },
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find transaction and verify ownership
    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Update account balance (reverse the transaction)
    const balanceChange =
      transaction.type === "income" ? -transaction.amount : transaction.amount;
    const account = await Account.findById(transaction.accountId);
    if (account) {
      account.balance += balanceChange;
      await account.save();
    }

    // Delete transaction
    await Transaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTransactionAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const analytics = await Transaction.getAnalytics(
      userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get transaction analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
