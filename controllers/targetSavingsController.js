import TargetSavings from "../models/TargetSavings.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

// Create a new target savings goal
export const createTargetSavings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, targetAmount, description, color, accountId } = req.body;

    const targetSavings = new TargetSavings({
      userId,
      title,
      accountId: new mongoose.Types.ObjectId(accountId),
      targetAmount: parseFloat(targetAmount),
      description,
      color: color || "#3B82F6",
    });

    await targetSavings.save();

    res.status(201).json({
      success: true,
      message: "Target savings created successfully",
      data: targetSavings.getSummary(),
    });
  } catch (error) {
    console.error("Create target savings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all target savings for a user
export const getUserTargetSavings = async (req, res) => {
  try {
    const userId = req.user._id;

    const targets = await TargetSavings.find({ userId }).populate(
      "accountId",
      "name"
    );

    res.json({
      success: true,
      data: targets.map((target) => target.getSummary()),
    });
  } catch (error) {
    console.error("Get target savings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific target savings with analysis
export const getTargetSavingsById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const target = await TargetSavings.getTargetWithAnalysis(id, userId);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Target savings not found",
      });
    }

    res.json({
      success: true,
      data: target,
    });
  } catch (error) {
    console.error("Get target savings by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update target savings
export const updateTargetSavings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    const target = await TargetSavings.findOne({ _id: id, userId });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Target savings not found",
      });
    }

    // Update fields
    if (updateData.title) target.title = updateData.title;
    if (updateData.targetAmount)
      target.targetAmount = parseFloat(updateData.targetAmount);

    if (updateData.description !== undefined)
      target.description = updateData.description;
    if (updateData.color) target.color = updateData.color;
    if (updateData.isActive !== undefined)
      target.isActive = updateData.isActive;

    if (updateData.accountId) {
      target.accountId = new mongoose.Types.ObjectId(updateData.accountId);
    }

    await target.save();

    res.json({
      success: true,
      message: "Target savings updated successfully",
      data: target.getSummary(),
    });
  } catch (error) {
    console.error("Update target savings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete target savings
export const deleteTargetSavings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const target = await TargetSavings.findOne({ _id: id, userId });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Target savings not found",
      });
    }

    await TargetSavings.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Target savings deleted successfully",
    });
  } catch (error) {
    console.error("Delete target savings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Check if a transaction would exceed any target savings
export const checkTargetSavingsWarning = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, type } = req.body;

    // Only check for expense transactions
    if (type !== "expense") {
      return res.json({
        success: true,
        data: { hasWarning: false },
      });
    }

    // Get all active targets
    const targets = await TargetSavings.find({ userId, isActive: true });

    const warnings = [];

    // Compute spendable funds without touching savings: total balance - total current savings
    const totalBalanceAgg = await mongoose.model("Account").aggregate([
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
    const totalBalanceAmount = totalBalanceAgg[0]?.totalBalance || 0;
    const totalCurrentSavings = targets.reduce(
      (sum, t) => sum + (t.currentAmount || 0),
      0
    );
    const availableForSpending = Math.max(
      totalBalanceAmount - totalCurrentSavings,
      0
    );
    const spendingAmount = parseFloat(amount);

    if (spendingAmount > availableForSpending) {
      warnings.push({
        type: "overall",
        totalBalance: totalBalanceAmount,
        availableForSpending,
        spendingAmount,
        excess: spendingAmount - availableForSpending,
      });
    }

    res.json({
      success: true,
      data: {
        hasWarning: warnings.length > 0,
        warnings,
      },
    });
  } catch (error) {
    console.error("Check target savings warning error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get savings overview
export const getSavingsOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all active targets
    const targets = await TargetSavings.find({
      userId,
      isActive: true,
    }).populate("accountId", "name");

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
    const totalSavingsTarget = targets.reduce(
      (sum, target) => sum + target.targetAmount,
      0
    );
    const totalCurrentSavings = targets.reduce(
      (sum, target) => sum + target.currentAmount,
      0
    );
    // Spendable funds without touching savings
    const availableForSpending = Math.max(
      totalBalanceAmount - totalCurrentSavings,
      0
    );
    const savingsProgress =
      totalSavingsTarget > 0
        ? (totalCurrentSavings / totalSavingsTarget) * 100
        : 0;

    res.json({
      success: true,
      data: {
        totalSavingsTarget,
        totalCurrentSavings,
        totalBalance: totalBalanceAmount,
        availableForSpending,
        savingsProgress,
        activeTargets: targets.map((target) => target.getSummary()),
      },
    });
  } catch (error) {
    console.error("Get savings overview error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Deduct a deficit amount from user's savings goals (currentAmount), highest balances first
export const deductFromSavings = async (userId, deficitAmount) => {
  try {
    let remaining = parseFloat(deficitAmount);
    if (!remaining || remaining <= 0) return;

    const targets = await TargetSavings.find({
      userId,
      isActive: true,
    }).sort({ currentAmount: -1, createdAt: -1 });

    for (const target of targets) {
      if (remaining <= 0) break;
      const deduction = Math.min(target.currentAmount, remaining);
      if (deduction > 0) {
        target.currentAmount = Math.max(target.currentAmount - deduction, 0);
        await target.save();
        remaining -= deduction;
      }
    }
  } catch (error) {
    console.error("Deduct from savings error:", error);
  }
};

// Update target savings progress (called when transactions are added/updated)
export const updateTargetProgress = async (userId, amount, type) => {
  try {
    // Only update for expense transactions
    if (type !== "expense") return;

    const targets = await TargetSavings.find({
      userId,
      isActive: true,
    }).populate("accountId", "name");

    for (const target of targets) {
      // Update current amount based on transaction type
      if (type === "expense") {
        target.currentAmount += amount;
      } else if (type === "income") {
        // For income, we might want to reduce the target progress
        // This is optional and depends on the business logic
      }

      await target.save();
    }
  } catch (error) {
    console.error("Update target progress error:", error);
  }
};
