import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import FixedExpense from "../models/FixedExpense.js";
import PossibleExpense from "../models/PossibleExpense.js";
import Budget from "../models/Budget.js";
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

    // Calculate date range for transactions
    const startDate = new Date(queryMonth + "-01");
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

    // Get all data in parallel for better performance
    const [
      accounts,
      transactions,
      fixedExpenses,
      possibleExpenses,
      budgets,
      analytics,
    ] = await Promise.all([
      Account.find({ userId, isActive: true }).sort({ name: 1 }),
      Transaction.getUserTransactions(userId, {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        limit: 100,
      }),
      FixedExpense.getUserFixedExpenses(userId),
      PossibleExpense.getUserPossibleExpenses(userId),
      Budget.getBudgetWithSpending(userId, queryMonth),
      getAnalyticsData(userId, queryMonth),
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
    // Calculate analytics directly
    const startDate = new Date(month + "-01");
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    );

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

const groupTransactionsByDate = (transactions) => {
  const groups = {};

  transactions.forEach((transaction) => {
    const date = transaction.date.toISOString().split("T")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      date: date,
      account: transaction.accountId?._id || null,
      accountName: transaction.accountId?.name || "Unknown Account",
      time: transaction.time,
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
