import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

export const createBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, amount, month } = req.body;

    // Check if budget already exists for this category and month
    const existingBudget = await Budget.findOne({
      userId,
      category,
      month,
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: "Budget already exists for this category and month",
      });
    }

    const budget = new Budget({
      userId,
      category,
      amount: parseFloat(amount),
      month,
    });

    await budget.save();

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month } = req.query;

    const filters = { userId };
    if (month) {
      filters.month = month;
    }

    const budgets = await Budget.find(filters).sort({ category: 1 });

    // If month is specified, get spending data for each budget
    if (month) {
      const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
          const spending = await Transaction.aggregate([
            {
              $match: {
                userId: budget.userId,
                category: budget.category,
                type: "expense",
                date: {
                  $gte: new Date(month + "-01"),
                  $lt: new Date(
                    new Date(month + "-01").getFullYear(),
                    new Date(month + "-01").getMonth() + 1,
                    1
                  ),
                },
              },
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: "$amount" },
              },
            },
          ]);

          const totalSpent = spending.length > 0 ? spending[0].totalSpent : 0;
          const remaining = budget.amount - totalSpent;
          const percentageUsed = (totalSpent / budget.amount) * 100;

          return {
            ...budget.toObject(),
            totalSpent,
            remaining,
            percentageUsed,
          };
        })
      );

      return res.json({
        success: true,
        data: budgetsWithSpending,
      });
    }

    res.json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    // Find budget and verify ownership
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Update budget
    const updatedBudget = await Budget.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Budget updated successfully",
      data: updatedBudget,
    });
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find budget and verify ownership
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Delete budget
    await Budget.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBudgetAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month parameter is required",
      });
    }

    const budgets = await Budget.find({ userId, month });
    const startDate = new Date(month + "-01");
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1
    );

    const analytics = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await Transaction.aggregate([
          {
            $match: {
              userId: budget.userId,
              category: budget.category,
              type: "expense",
              date: { $gte: startDate, $lt: endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: "$amount" },
              transactionCount: { $sum: 1 },
            },
          },
        ]);

        const totalSpent = spending.length > 0 ? spending[0].totalSpent : 0;
        const remaining = budget.amount - totalSpent;
        const percentageUsed = (totalSpent / budget.amount) * 100;
        const transactionCount =
          spending.length > 0 ? spending[0].transactionCount : 0;

        return {
          category: budget.category,
          budgetAmount: budget.amount,
          totalSpent,
          remaining,
          percentageUsed,
          transactionCount,
          status:
            percentageUsed > 100
              ? "exceeded"
              : percentageUsed > 80
              ? "warning"
              : "good",
        };
      })
    );

    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = analytics.reduce(
      (sum, item) => sum + item.totalSpent,
      0
    );
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentageUsed =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    res.json({
      success: true,
      data: {
        month,
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercentageUsed,
        budgets: analytics,
      },
    });
  } catch (error) {
    console.error("Get budget analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
