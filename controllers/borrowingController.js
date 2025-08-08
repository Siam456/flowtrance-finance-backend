import Borrowing from "../models/Borrowing.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { validateRequest } from "../middleware/validation.js";

// Create a new borrowing/lending record
const createBorrowing = async (req, res) => {
  try {
    const {
      personName,
      type,
      amount,
      accountId,
      description,
      transactionDate,
      dueDate,
    } = req.body;

    // Get account details
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Check if account belongs to user
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this account",
      });
    }

    // Create borrowing record with paid status by default
    const borrowing = new Borrowing({
      userId: req.user.id,
      personName,
      type,
      amount,
      accountId,
      accountName: account.name,
      description,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      isPaid: false, // Set as paid by default
      paidDate: null, // Set paid date to current date
    });

    await borrowing.save();

    // Create a transaction for this borrowing/lending
    const transactionDateToUse = transactionDate
      ? new Date(transactionDate)
      : new Date();
    const transaction = new Transaction({
      userId: req.user.id,
      type: type === "borrowed" ? "income" : "expense",
      amount: amount,
      category: type === "borrowed" ? "Borrowed Money" : "Lent Money",
      description: `${
        type === "borrowed" ? "Borrowed from" : "Lent to"
      } ${personName}${description ? ` - ${description}` : ""}`,
      accountId: accountId,
      accountName: account.name,
      date: transactionDateToUse || new Date(),
      time:
        transactionDateToUse?.toLocaleTimeString() ||
        new Date().toLocaleTimeString(),
    });

    await transaction.save();

    // Update account balance based on type
    if (type === "borrowed") {
      // You borrowed money, so your account balance increases
      account.balance += amount;
    } else if (type === "lent") {
      // You lent money, so your account balance decreases
      account.balance -= amount;
    }

    await account.save();

    res.status(201).json({
      success: true,
      message: "Borrowing record created successfully",
      data: borrowing,
    });
  } catch (error) {
    console.error("Error creating borrowing record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create borrowing record",
      error: error.message,
    });
  }
};

// Get all borrowing records for a user
const getBorrowings = async (req, res) => {
  try {
    const { type, isPaid, personName } = req.query;
    const filter = { userId: req.user.id, isActive: true };

    if (type) filter.type = type;
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";
    if (personName) {
      filter.personName = { $regex: new RegExp(personName, "i") };
    }

    const borrowings = await Borrowing.find(filter)
      .populate("accountId", "name balance")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: borrowings,
    });
  } catch (error) {
    console.error("Error fetching borrowings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowing records",
      error: error.message,
    });
  }
};

// Get borrowing summary
const getBorrowingSummary = async (req, res) => {
  try {
    const summary = await Borrowing.getUserSummary(req.user.id);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching borrowing summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowing summary",
      error: error.message,
    });
  }
};

// Get person summary
const getPersonSummary = async (req, res) => {
  try {
    const { personName } = req.params;
    const summary = await Borrowing.getPersonSummary(req.user.id, personName);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching person summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch person summary",
      error: error.message,
    });
  }
};

// Update borrowing record
const updateBorrowing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const borrowing = await Borrowing.findById(id);
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: "Borrowing record not found",
      });
    }

    if (borrowing.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If amount or type is being updated, we need to adjust account balance
    if (updateData.amount || updateData.type) {
      const account = await Account.findById(borrowing.accountId);
      if (account) {
        // Revert the old transaction
        if (borrowing.type === "borrowed") {
          account.balance -= borrowing.amount;
        } else if (borrowing.type === "lent") {
          account.balance += borrowing.amount;
        }

        // Apply the new transaction
        const newType = updateData.type || borrowing.type;
        const newAmount = updateData.amount || borrowing.amount;

        if (newType === "borrowed") {
          account.balance += newAmount;
        } else if (newType === "lent") {
          account.balance -= newAmount;
        }

        await account.save();
      }
    }

    // Update the borrowing record
    Object.assign(borrowing, updateData);
    await borrowing.save();

    res.json({
      success: true,
      message: "Borrowing record updated successfully",
      data: borrowing,
    });
  } catch (error) {
    console.error("Error updating borrowing record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update borrowing record",
      error: error.message,
    });
  }
};

// Mark as paid/unpaid and create/remove corresponding transaction and adjust account balance
const togglePaidStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    const borrowing = await Borrowing.findById(id);
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: "Borrowing record not found",
      });
    }

    if (borrowing.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Load account
    const account = await Account.findById(borrowing.accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Linked account not found",
      });
    }

    // If marking as paid: create a counter transaction (repayment) and adjust balance
    if (isPaid) {
      // If there is already a repayment transaction, skip creating duplicate
      if (!borrowing.repaymentTransactionId) {
        const repaymentType =
          borrowing.type === "borrowed" ? "expense" : "income";
        const repaymentCategory =
          borrowing.type === "borrowed" ? "Loan Repayment" : "Loan Collection";
        const repaymentDescription = `${
          borrowing.type === "borrowed" ? "Repayment to" : "Collection from"
        } ${borrowing.personName}${
          borrowing.description ? ` - ${borrowing.description}` : ""
        }`;

        const repaymentDate = new Date();
        const repaymentTransaction = new Transaction({
          userId: req.user.id,
          accountId: borrowing.accountId,
          type: repaymentType,
          amount: borrowing.amount,
          category: repaymentCategory,
          description: repaymentDescription,
          date: repaymentDate,
          time: repaymentDate.toLocaleTimeString(),
        });

        await repaymentTransaction.save();

        // Adjust account balance: paying back borrowed money reduces balance; collecting lent money increases balance
        if (borrowing.type === "borrowed") {
          account.balance -= borrowing.amount;
        } else if (borrowing.type === "lent") {
          account.balance += borrowing.amount;
        }
        await account.save();

        borrowing.repaymentTransactionId = repaymentTransaction._id;
      }
      borrowing.isPaid = true;
      borrowing.paidDate = new Date();
    } else {
      // Marking as unpaid: if a repayment transaction exists, remove it and revert account balance
      if (borrowing.repaymentTransactionId) {
        const repaymentTx = await Transaction.findById(
          borrowing.repaymentTransactionId
        );
        if (repaymentTx) {
          await repaymentTx.deleteOne();
        }
        // Revert account balance change performed during repayment creation
        if (borrowing.type === "borrowed") {
          account.balance += borrowing.amount;
        } else if (borrowing.type === "lent") {
          account.balance -= borrowing.amount;
        }
        await account.save();

        borrowing.repaymentTransactionId = undefined;
      }
      borrowing.isPaid = false;
      borrowing.paidDate = null;
    }

    await borrowing.save();

    res.json({
      success: true,
      message: `Borrowing record marked as ${isPaid ? "paid" : "unpaid"}`,
      data: borrowing,
    });
  } catch (error) {
    console.error("Error updating paid status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update paid status",
      error: error.message,
    });
  }
};

// Delete borrowing record
const deleteBorrowing = async (req, res) => {
  try {
    const { id } = req.params;

    const borrowing = await Borrowing.findById(id);
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: "Borrowing record not found",
      });
    }

    if (borrowing.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Revert account balance if not paid
    if (!borrowing.isPaid) {
      const account = await Account.findById(borrowing.accountId);
      if (account) {
        if (borrowing.type === "borrowed") {
          account.balance -= borrowing.amount;
        } else if (borrowing.type === "lent") {
          account.balance += borrowing.amount;
        }
        await account.save();
      }
    }

    // Soft delete
    borrowing.isActive = false;
    await borrowing.save();

    res.json({
      success: true,
      message: "Borrowing record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting borrowing record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete borrowing record",
      error: error.message,
    });
  }
};

export {
  createBorrowing,
  getBorrowings,
  getBorrowingSummary,
  getPersonSummary,
  updateBorrowing,
  togglePaidStatus,
  deleteBorrowing,
};
