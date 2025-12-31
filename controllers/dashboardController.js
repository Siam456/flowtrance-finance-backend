import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import FixedExpense from "../models/FixedExpense.js";
import PossibleExpense from "../models/PossibleExpense.js";
import Budget from "../models/Budget.js";
import TargetSavings from "../models/TargetSavings.js";
import mongoose from "mongoose";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    // Determine the month to query for
    let queryMonth;
    if (month && year) {
      queryMonth = `${year}-${String(month).padStart(2, "0")}`;
    } else if (month) {
      queryMonth = `${new Date().getFullYear()}-${String(month).padStart(
        2,
        "0"
      )}`;
    } else if (year) {
      queryMonth = `${year}-${String(new Date().getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    } else {
      queryMonth = new Date().toISOString().substring(0, 7);
    }

    // Calculate date range for transactions in UTC
    // Parse the month string and create UTC dates to avoid timezone shifts
    const [yearNum, monthNum] = queryMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    // Get all data in parallel for better performance
    const [
      accounts,
      transactions,
      fixedExpenses,
      possibleExpenses,
      budgets,
      analytics,
      savingsOverview,
    ] = await Promise.all([
      Account.find({ userId, isActive: true }).sort({ name: 1 }),
      Transaction.getUserTransactions(userId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      }),
      FixedExpense.getUserFixedExpenses(userId),
      PossibleExpense.getUserPossibleExpenses(userId),
      Budget.getBudgetWithSpending(userId, queryMonth),
      getAnalyticsData(userId, queryMonth),
      getSavingsOverviewData(userId, queryMonth),
    ]);

    // Calculate total balance
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    // Calculate monthly totals (transactions are already filtered by month)
    const monthlyIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Group transactions by date for frontend
    const groupedTransactions = groupTransactionsByDate(transactions);

    const dashboardData = {
      user: req.user.toPublicJSON(),
      accounts: accounts.map((account) => account.getSummary()),
      transactions: groupedTransactions,
      fixedExpenses: fixedExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        dueDate: expense.dueDate,
        isPaid: expense.isPaid,
        account: expense.accountId._id,
        accountName: expense.accountId.name,
      })),
      possibleExpenses: possibleExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        expectedAmount: expense.expectedAmount,
        category: expense.category,
        account: expense.accountId._id,
        accountName: expense.accountId.name,
        notes: expense.notes,
      })),
      budgets: budgets,
      analytics: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate:
          monthlyIncome > 0
            ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
            : 0,
        ...analytics,
      },
      savingsOverview,
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAnalyticsData = async (userId, month) => {
  try {
    // Calculate analytics directly using UTC dates
    const [yearNum, monthNum] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    const [categoryBreakdown, topCategories] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: "expense",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            income: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),
    ]);

    const analytics = {
      categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
        acc[item._id] = item.total;
        return acc;
      }, {}),
      topCategories: categoryBreakdown.slice(0, 5).map((item) => ({
        category: item._id,
        amount: item.total,
        percentage: 0, // Will be calculated below
      })),
      monthlyTrend: topCategories.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(
          2,
          "0"
        )}-${String(item._id.day).padStart(2, "0")}`,
        income: item.income,
        expenses: item.expenses,
        savings: item.income - item.expenses,
      })),
    };

    // Calculate percentages for top categories
    const totalExpenses = categoryBreakdown.reduce(
      (sum, item) => sum + item.total,
      0
    );
    analytics.topCategories.forEach((category) => {
      category.percentage =
        totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
    });

    return analytics;
  } catch (error) {
    console.error("Analytics calculation error:", error);
    return {
      categoryBreakdown: {},
      topCategories: [],
      monthlyTrend: [],
    };
  }
};

const getSavingsOverviewData = async (userId, month) => {
  try {
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

    // Get current month's expenses
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const monthlyExpensesAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "expense",
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
        },
      },
    ]);

    const monthlyExpenses = monthlyExpensesAgg[0]?.totalExpenses || 0;

    // Treat configured target amounts as reserved savings for display
    const totalCurrentSavings = totalSavingsTarget;
    // Spendable funds without touching reserved savings, minus current month expenses
    const availableForSpending = Math.max(
      totalBalanceAmount - totalSavingsTarget - monthlyExpenses,
      0
    );
    const savingsProgress =
      totalSavingsTarget > 0
        ? (totalCurrentSavings / totalSavingsTarget) * 100
        : 0;

    return {
      totalSavingsTarget,
      totalCurrentSavings,
      totalBalance: totalBalanceAmount,
      availableForSpending,
      savingsProgress,
      activeTargets: targets.map((target) => target.getSummary()),
    };
  } catch (error) {
    console.error("Get savings overview error:", error);
    return {
      totalSavingsTarget: 0,
      totalCurrentSavings: 0,
      totalBalance: 0,
      availableForSpending: 0,
      savingsProgress: 0,
      activeTargets: [],
    };
  }
};

const groupTransactionsByDate = (transactions) => {
  const groups = {};

  transactions.forEach((transaction) => {
    // Extract local date from the transaction date
    // The date is stored in UTC, but we need to group by the local date
    // Using server's local timezone (Asia/Dhaka UTC+6) to extract date components
    // This ensures transactions are grouped by the user's local date, not UTC date
    const transactionDate = new Date(transaction.date);
    
    // Get the local date components using server's timezone
    // getFullYear(), getMonth(), getDate() use local timezone
    const year = transactionDate.getFullYear();
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const day = String(transactionDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    if (!groups[localDateString]) {
      groups[localDateString] = [];
    }
    groups[localDateString].push({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      date: transaction.date.toISOString(), // Return full ISO string for frontend timezone handling
      account: transaction.accountId?._id || null,
      accountName: transaction.accountId?.name || "Unknown Account",
      time: transaction.time,
      createdAt: transaction.createdAt, // Include createdAt for sorting
    });
  });

  // Sort dates in descending order and transactions by time
  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => ({
      date,
      transactions: groups[date].sort((a, b) =>
        (b.time || "").localeCompare(a.time || "")
      ),
    }));
};

// Helper function to get query month from request
const getQueryMonth = (req) => {
  const { month, year } = req.query;
  if (month && year) {
    return `${year}-${String(month).padStart(2, "0")}`;
  } else if (month) {
    return `${new Date().getFullYear()}-${String(month).padStart(2, "0")}`;
  } else if (year) {
    return `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  } else {
    return new Date().toISOString().substring(0, 7);
  }
};

// Get dashboard summary (quick stats only)
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryMonth = getQueryMonth(req);

    // Calculate date range for transactions in UTC
    const [yearNum, monthNum] = queryMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    // Get only essential data in parallel
    const [accounts, transactions] = await Promise.all([
      Account.find({ userId, isActive: true }).sort({ name: 1 }),
      Transaction.getUserTransactions(userId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      }),
    ]);

    // Calculate totals
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    const monthlyIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        user: req.user.toPublicJSON(),
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate:
          monthlyIncome > 0
            ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
            : 0,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get transactions
export const getDashboardTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryMonth = getQueryMonth(req);

    // Calculate date range for transactions in UTC
    const [yearNum, monthNum] = queryMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    const transactions = await Transaction.getUserTransactions(userId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 100,
    });

    const groupedTransactions = groupTransactionsByDate(transactions);

    res.json({
      success: true,
      data: groupedTransactions,
    });
  } catch (error) {
    console.error("Dashboard transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get budgets
export const getDashboardBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryMonth = getQueryMonth(req);

    const budgets = await Budget.getBudgetWithSpending(userId, queryMonth);

    res.json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error("Dashboard budgets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get savings overview
export const getDashboardSavings = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryMonth = getQueryMonth(req);

    const savingsOverview = await getSavingsOverviewData(userId, queryMonth);

    res.json({
      success: true,
      data: savingsOverview,
    });
  } catch (error) {
    console.error("Dashboard savings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get analytics (lazy loaded)
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryMonth = getQueryMonth(req);

    const analytics = await getAnalyticsData(userId, queryMonth);

    // Get accounts for total balance calculation
    const accounts = await Account.find({ userId, isActive: true });
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    res.json({
      success: true,
      data: {
        ...analytics,
        totalBalance,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
