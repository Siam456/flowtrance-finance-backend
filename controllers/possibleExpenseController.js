import PossibleExpense from "../models/PossibleExpense.js";
import Account from "../models/Account.js";

export const createPossibleExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, expectedAmount, category, accountId, notes } = req.body;

    // Verify account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const possibleExpense = new PossibleExpense({
      userId,
      title,
      expectedAmount: parseFloat(expectedAmount),
      category,
      accountId,
      notes,
    });

    await possibleExpense.save();
    await possibleExpense.populate("accountId", "name type");

    res.status(201).json({
      success: true,
      message: "Possible expense created successfully",
      data: {
        id: possibleExpense._id,
        title: possibleExpense.title,
        expectedAmount: possibleExpense.expectedAmount,
        category: possibleExpense.category,
        account: possibleExpense.accountId._id,
        accountName: possibleExpense.accountId.name,
        notes: possibleExpense.notes,
      },
    });
  } catch (error) {
    console.error("Create possible expense error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPossibleExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.query;

    const filters = { userId };
    if (category) {
      filters.category = category;
    }

    const possibleExpenses = await PossibleExpense.find(filters)
      .populate("accountId", "name type")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: possibleExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        expectedAmount: expense.expectedAmount,
        category: expense.category,
        account: expense.accountId._id,
        accountName: expense.accountId.name,
        notes: expense.notes,
      })),
    });
  } catch (error) {
    console.error("Get possible expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePossibleExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    // Find possible expense and verify ownership
    const possibleExpense = await PossibleExpense.findOne({ _id: id, userId });
    if (!possibleExpense) {
      return res.status(404).json({
        success: false,
        message: "Possible expense not found",
      });
    }

    // Update possible expense
    const updatedPossibleExpense = await PossibleExpense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("accountId", "name type");

    res.json({
      success: true,
      message: "Possible expense updated successfully",
      data: {
        id: updatedPossibleExpense._id,
        title: updatedPossibleExpense.title,
        expectedAmount: updatedPossibleExpense.expectedAmount,
        category: updatedPossibleExpense.category,
        account: updatedPossibleExpense.accountId._id,
        accountName: updatedPossibleExpense.accountId.name,
        notes: updatedPossibleExpense.notes,
      },
    });
  } catch (error) {
    console.error("Update possible expense error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deletePossibleExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find possible expense and verify ownership
    const possibleExpense = await PossibleExpense.findOne({ _id: id, userId });
    if (!possibleExpense) {
      return res.status(404).json({
        success: false,
        message: "Possible expense not found",
      });
    }

    // Delete possible expense
    await PossibleExpense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Possible expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete possible expense error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPossibleExpensesByCategory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.params;

    const possibleExpenses = await PossibleExpense.find({
      userId,
      category,
    })
      .populate("accountId", "name type")
      .sort({ expectedAmount: -1 });

    const totalExpectedAmount = possibleExpenses.reduce(
      (sum, expense) => sum + expense.expectedAmount,
      0
    );

    res.json({
      success: true,
      data: {
        category,
        totalExpectedAmount,
        expenses: possibleExpenses.map((expense) => ({
          id: expense._id,
          title: expense.title,
          expectedAmount: expense.expectedAmount,
          account: expense.accountId._id,
          accountName: expense.accountId.name,
          notes: expense.notes,
        })),
      },
    });
  } catch (error) {
    console.error("Get possible expenses by category error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const convertToTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { amount, description, date } = req.body;

    // Find possible expense and verify ownership
    const possibleExpense = await PossibleExpense.findOne({ _id: id, userId });
    if (!possibleExpense) {
      return res.status(404).json({
        success: false,
        message: "Possible expense not found",
      });
    }

    // Create transaction
    const Transaction = (await import("../models/Transaction.js")).default;
    const transaction = new Transaction({
      userId,
      accountId: possibleExpense.accountId,
      type: "expense",
      amount: parseFloat(amount) || possibleExpense.expectedAmount,
      description: description || possibleExpense.title,
      category: possibleExpense.category,
      date: new Date(date) || new Date(),
    });

    await transaction.save();
    await transaction.populate("accountId", "name type");

    // Update account balance
    const account = await Account.findById(possibleExpense.accountId);
    if (account) {
      account.balance -= transaction.amount;
      await account.save();
    }

    // Delete possible expense
    await PossibleExpense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Possible expense converted to transaction",
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          category: transaction.category,
          date: transaction.date.toISOString().split("T")[0],
          account: transaction.accountId._id,
          accountName: transaction.accountId.name,
        },
        account: account ? account.getSummary() : null,
      },
    });
  } catch (error) {
    console.error("Convert to transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
