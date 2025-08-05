import FixedExpense from "../models/FixedExpense.js";
import Account from "../models/Account.js";

export const createFixedExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      amount,
      category,
      dueDate,
      accountId,
      isPaid = false,
    } = req.body;

    // Verify account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const fixedExpense = new FixedExpense({
      userId,
      title,
      amount: parseFloat(amount),
      category,
      dueDate: new Date(dueDate),
      accountId,
      isPaid,
    });

    await fixedExpense.save();
    await fixedExpense.populate("accountId", "name type");

    res.status(201).json({
      success: true,
      message: "Fixed expense created successfully",
      data: {
        id: fixedExpense._id,
        title: fixedExpense.title,
        amount: fixedExpense.amount,
        category: fixedExpense.category,
        dueDate: fixedExpense.dueDate,
        isPaid: fixedExpense.isPaid,
        account: fixedExpense.accountId._id,
        accountName: fixedExpense.accountId.name,
      },
    });
  } catch (error) {
    console.error("Create fixed expense error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getFixedExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isActive, isPaid, category } = req.query;

    const filters = { userId };
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }
    if (isPaid !== undefined) {
      filters.isPaid = isPaid === "true";
    }
    if (category) {
      filters.category = category;
    }

    const fixedExpenses = await FixedExpense.find(filters)
      .populate("accountId", "name type")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: fixedExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        dueDate: expense.dueDate,
        isPaid: expense.isPaid,
        account: expense.accountId._id,
        accountName: expense.accountId.name,
      })),
    });
  } catch (error) {
    console.error("Get fixed expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateFixedExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    // Find fixed expense and verify ownership
    const fixedExpense = await FixedExpense.findOne({ _id: id, userId });
    if (!fixedExpense) {
      return res.status(404).json({
        success: false,
        message: "Fixed expense not found",
      });
    }

    // Update fixed expense
    const updatedFixedExpense = await FixedExpense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("accountId", "name type");

    res.json({
      success: true,
      message: "Fixed expense updated successfully",
      data: {
        id: updatedFixedExpense._id,
        title: updatedFixedExpense.title,
        amount: updatedFixedExpense.amount,
        category: updatedFixedExpense.category,
        dueDate: updatedFixedExpense.dueDate,
        isPaid: updatedFixedExpense.isPaid,
        account: updatedFixedExpense.accountId._id,
        accountName: updatedFixedExpense.accountId.name,
      },
    });
  } catch (error) {
    console.error("Update fixed expense error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteFixedExpense = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find fixed expense and verify ownership
    const fixedExpense = await FixedExpense.findOne({ _id: id, userId });
    if (!fixedExpense) {
      return res.status(404).json({
        success: false,
        message: "Fixed expense not found",
      });
    }

    // Delete fixed expense
    await FixedExpense.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Fixed expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete fixed expense error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find fixed expense and verify ownership
    const fixedExpense = await FixedExpense.findOne({ _id: id, userId });
    if (!fixedExpense) {
      return res.status(404).json({
        success: false,
        message: "Fixed expense not found",
      });
    }

    // Mark as paid
    fixedExpense.isPaid = true;
    await fixedExpense.save();
    await fixedExpense.populate("accountId", "name type");

    res.json({
      success: true,
      message: "Fixed expense marked as paid",
      data: {
        id: fixedExpense._id,
        title: fixedExpense.title,
        amount: fixedExpense.amount,
        category: fixedExpense.category,
        dueDate: fixedExpense.dueDate,
        isPaid: fixedExpense.isPaid,
        account: fixedExpense.accountId._id,
        accountName: fixedExpense.accountId.name,
      },
    });
  } catch (error) {
    console.error("Mark as paid error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUpcomingExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const upcomingExpenses = await FixedExpense.find({
      userId,
      isActive: true,
      dueDate: { $lte: endDate },
      $or: [{ isPaid: false }, { isPaid: { $exists: false } }],
    })
      .populate("accountId", "name type")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: upcomingExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        dueDate: expense.dueDate,
        isPaid: expense.isPaid,
        account: expense.accountId._id,
        accountName: expense.accountId.name,
        daysUntilDue: Math.ceil(
          (expense.dueDate - new Date()) / (1000 * 60 * 60 * 24)
        ),
      })),
    });
  } catch (error) {
    console.error("Get upcoming expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
